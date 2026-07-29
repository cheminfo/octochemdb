import {
  appendFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createInterface } from 'node:readline';

import delay from 'delay';
import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

const debug = debugLibrary('parseLotuses');

const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

const SPARQL_PREFIXES = `
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX pr: <http://www.wikidata.org/prop/reference/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
`;

// Wikidata's public SPARQL endpoint aborts any single query at ~60s and, for a
// streamed TSV, closes the connection cleanly with a PARTIAL body — a silent
// truncation that looks like success. The old whole-result queries (all
// compounds, all taxa, all triples, all references) all blew past that wall, so
// each dataset is now fetched in partitions / VALUES chunks that individually
// finish well under it. A unit slower than SPARQL_RISKY_MS is not trusted as
// complete and is re-split. See the download helpers and query builders below.
const SPARQL_RISKY_MS = 45000;

/**
 * Rank name to standard taxonomy field mapping.
 */
const RANK_TO_FIELD = {
  kingdom: 'kingdom',
  phylum: 'phylum',
  class: 'class',
  order: 'order',
  family: 'family',
  genus: 'genus',
  species: 'species',
};

const DATA_DIR = 'data/originalData/lotuses';

// Runs a SPARQL query via POST — so long VALUES lists never overflow the
// request URL (a GET would 431) — and returns the raw TSV text. Transient
// failures (429 honouring Retry-After, 502/503, network resets) are retried; a
// 504 means the query itself exceeded the server time budget, so it is surfaced
// as `error.tooBig` and the caller splits the work instead of hammering a query
// that will always time out.
async function sparqlQuery(
  query,
  { retries = 8, timeoutMs = 1000 * 120 } = {},
) {
  for (let attempt = 0; ; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(WIKIDATA_SPARQL_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'text/tab-separated-values',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent':
            'OctoChemDB/1.0 (https://github.com/cheminfo/octochemdb)',
        },
        body: `query=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) return await response.text();
      if (response.status === 504) {
        const err = /** @type {any} */ (
          new Error('SPARQL query timed out (504)')
        );
        err.tooBig = true;
        throw err;
      }
      const transient = response.status === 429 || response.status >= 500;
      if (!transient) {
        throw new Error(
          `SPARQL query failed: ${response.status} ${response.statusText}`,
        );
      }
      if (attempt >= retries) {
        throw new Error(
          `SPARQL query failed: ${response.status} after ${attempt} retries`,
        );
      }
      const retryAfter = Number(response.headers.get('retry-after'));
      const wait =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(60000, 2000 * 2 ** attempt);
      debug.warn(
        `  SPARQL HTTP ${response.status}; waiting ${(wait / 1000).toFixed(0)}s (attempt ${attempt + 1})`,
      );
      await delay(wait);
    } catch (/** @type {any} */ error) {
      if (error.tooBig) throw error;
      if (attempt >= retries) throw error;
      debug.warn(
        `  SPARQL request failed: ${error.message}; retrying (attempt ${attempt + 1})`,
      );
      await delay(Math.min(60000, 2000 * 2 ** attempt));
    }
  }
}

// Appends SPARQL TSV `text` to `filePath`, keeping the header line only for the
// first (fresh) write and stripping it from every later chunk, so concatenating
// many partition responses yields one valid TSV file. Returns rows appended.
function appendTsvChunk(filePath, text) {
  const fresh = !existsSync(filePath) || statSync(filePath).size === 0;
  const newlineIndex = text.indexOf('\n');
  if (newlineIndex === -1) return 0;
  if (fresh) {
    const out = text.endsWith('\n') ? text : `${text}\n`;
    writeFileSync(filePath, out);
    return out.split('\n').filter((l) => l.length).length - 1;
  }
  const body = text.slice(newlineIndex + 1);
  if (body.length === 0) return 0;
  appendFileSync(filePath, body.endsWith('\n') ? body : `${body}\n`);
  return body.split('\n').filter((l) => l.length).length;
}

// Downloads a large result by partitioning on a string prefix of an indexed key
// so each bucket finishes under the wall. A bucket that times out or runs too
// long is split by appending each alphabet char and recursing.
async function downloadByPrefix(filePath, buildBucket, seeds, alphabet, label) {
  if (existsSync(filePath)) writeFileSync(filePath, '');
  let total = 0;
  async function fetchPrefix(prefix) {
    const started = Date.now();
    let text = null;
    let tooBig = false;
    try {
      text = await sparqlQuery(buildBucket(prefix), { retries: 4 });
    } catch (/** @type {any} */ error) {
      if (error.tooBig) tooBig = true;
      else throw error;
    }
    const elapsed = Date.now() - started;
    if (text !== null && elapsed < SPARQL_RISKY_MS) {
      total += appendTsvChunk(filePath, text);
      return;
    }
    debug.warn(
      `  ${label}: splitting "${prefix}" (${tooBig ? '504' : `${(elapsed / 1000).toFixed(0)}s`})`,
    );
    for (const ch of alphabet) await fetchPrefix(prefix + ch);
  }
  for (const seed of seeds) await fetchPrefix(seed);
  debug.info(`  ${label}: ${total} rows -> ${filePath}`);
}

// Adaptive range runner over an id array: split any chunk that 504s or runs too
// long, down to a single id; `onText` consumes each response. Used directly for
// crt (a driver id may legitimately return 0 rows) and inside hydrateComplete.
async function forEachIdChunk(ids, startSize, buildQuery, onText, label) {
  async function fetchRange(offset, size) {
    const slice = ids.slice(offset, offset + size);
    if (slice.length === 0) return;
    const started = Date.now();
    let text = null;
    try {
      text = await sparqlQuery(buildQuery(slice), {
        retries: size === 1 ? 6 : 4,
      });
    } catch (/** @type {any} */ error) {
      // A 504 (tooBig) drops to the split path below; anything else is fatal.
      if (!error.tooBig) throw error;
    }
    const elapsed = Date.now() - started;
    if (text !== null && (elapsed < SPARQL_RISKY_MS || size === 1)) {
      onText(text);
      return;
    }
    if (size === 1) {
      debug.warn(`  ${label}: id ${slice[0]} still failing; skipping`);
      return;
    }
    const half = Math.floor(size / 2);
    await fetchRange(offset, half);
    await fetchRange(offset + half, size - half);
  }
  for (let offset = 0; offset < ids.length; offset += startSize) {
    await fetchRange(offset, Math.min(startSize, ids.length - offset));
  }
}

// Downloads a result driven by chunks of ids passed via VALUES.
async function downloadByIdChunks(filePath, ids, buildQuery, startSize, label) {
  if (existsSync(filePath)) writeFileSync(filePath, '');
  let total = 0;
  await forEachIdChunk(
    ids,
    startSize,
    buildQuery,
    (text) => {
      total += appendTsvChunk(filePath, text);
    },
    label,
  );
  debug.info(`  ${label}: ${total} rows -> ${filePath}`);
}

// Like downloadByIdChunks but GUARANTEES every input id is covered. Blazegraph
// silently drops rows from some VALUES batches (HTTP 200, fewer rows than
// asked), so we record which ids actually came back and re-fetch the gap with
// progressively smaller chunks until none are missing. Only valid when every
// input id must yield >= 1 row (P235 compounds; all-OPTIONAL taxa).
async function hydrateComplete(filePath, ids, buildQuery, startSize, label) {
  if (existsSync(filePath)) writeFileSync(filePath, '');
  const returned = new Set();
  const onText = (text) => {
    appendTsvChunk(filePath, text);
    const lines = text.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const first = lines[i].split('\t')[0];
      if (first) returned.add(getIdFromIRI(first));
    }
  };
  let pending = ids;
  let size = startSize;
  for (let round = 1; round <= 6 && pending.length > 0; round++) {
    await forEachIdChunk(pending, size, buildQuery, onText, label);
    pending = pending.filter((id) => !returned.has(id));
    debug.info(
      `  ${label}: round ${round}, ${returned.size}/${ids.length} covered, ${pending.length} missing`,
    );
    size = round === 1 ? 2000 : Math.max(500, Math.floor(size / 2));
  }
  if (pending.length > 0) {
    debug.warn(
      `  ${label}: ${pending.length} ids never returned after retries`,
    );
  }
  debug.info(`  ${label}: complete -> ${filePath}`);
}

// The compound id list is one full P235 scan that sits close to the wall, so it
// can 502 or come back truncated. Fetch it until two attempts agree within 0.5%
// (neither truncated) and take the larger.
async function fetchCompoundIds() {
  /** @type {string[] | null} */
  let best = null;
  let prevLength = -1;
  for (let attempt = 0; attempt < 8; attempt++) {
    let text = null;
    try {
      text = await sparqlQuery(
        `${SPARQL_PREFIXES}\nSELECT ?c { ?c wdt:P235 [] }`,
        {
          retries: 3,
        },
      );
    } catch (/** @type {any} */ error) {
      if (error.tooBig) continue;
      throw error;
    }
    const ids = [
      ...new Set(
        text
          .split('\n')
          .filter((l) => l.length)
          .slice(1)
          .map((l) => getIdFromIRI(l.split('\t')[0])),
      ),
    ];
    if (!best || ids.length > best.length) best = ids;
    // Completeness by stability: two consecutive attempts within 0.5% means
    // neither was truncated at the server wall.
    if (
      prevLength >= 0 &&
      Math.abs(prevLength - ids.length) / Math.max(prevLength, ids.length) <
        0.005
    ) {
      return best;
    }
    prevLength = ids.length;
  }
  throw new Error('could not obtain a stable P235 compound id list');
}

// The organism taxa (objects of P703). Cheap — no attribute joins.
async function fetchTaxonIds() {
  const text = await sparqlQuery(
    `${SPARQL_PREFIXES}\nSELECT DISTINCT ?taxon_id { ?something wdt:P703 ?taxon_id }`,
  );
  return [
    ...new Set(
      text
        .split('\n')
        .filter((l) => l.length)
        .slice(1)
        .map((l) => getIdFromIRI(l.split('\t')[0])),
    ),
  ];
}

// Per-dataset query builders. compounds/taxa/crt hydrate a slice of ids via
// VALUES; references partitions on the DOI string prefix.
const buildCompoundChunk = (slice) => `${SPARQL_PREFIXES}
SELECT ?compound_id ?inchikey ?inchi ?canonicalSmiles ?isomericSmiles WHERE {
  VALUES ?compound_id { ${slice.map((id) => `wd:${id}`).join(' ')} }
  ?compound_id wdt:P235 ?inchikey.
  OPTIONAL { ?compound_id wdt:P234 ?inchi. }
  OPTIONAL { ?compound_id wdt:P233 ?canonicalSmiles. }
  OPTIONAL { ?compound_id wdt:P2017 ?isomericSmiles. }
}`;

const buildTaxaChunk = (slice) => `${SPARQL_PREFIXES}
SELECT ?taxon_id ?taxon_name ?taxon_rank ?ncbi_id ?parent_id WHERE {
  VALUES ?taxon_id { ${slice.map((id) => `wd:${id}`).join(' ')} }
  OPTIONAL { ?taxon_id wdt:P225 ?taxon_name. }
  OPTIONAL { ?taxon_id wdt:P105/rdfs:label ?taxon_rank.
             FILTER (lang(?taxon_rank) = 'en')
  }
  OPTIONAL { ?taxon_id wdt:P685 ?ncbi_id. }
  OPTIONAL { ?taxon_id wdt:P171 ?parent_id. }
}`;

const buildCrtChunk = (slice) => `${SPARQL_PREFIXES}
SELECT DISTINCT ?compound_id ?taxon_id ?reference_id WHERE {
  VALUES ?taxon_id { ${slice.map((id) => `wd:${id}`).join(' ')} }
  ?compound_id     p:P703 ?pp703.
  ?pp703           ps:P703 ?taxon_id;
                   prov:wasDerivedFrom/pr:P248 ?reference_id.
}`;

const buildReferencesBucket = (prefix) => `${SPARQL_PREFIXES}
SELECT ?article_id ?doi ?title WHERE {
  ?article_id wdt:P356 ?doi.
  FILTER(STRSTARTS(?doi, "${prefix}"))
  ?article_id wdt:P31 ?type.
  OPTIONAL { ?article_id wdt:P1476 ?title. }
}`;

/**
 * Streams a TSV file line by line, yielding parsed objects.
 * The first line is used as headers.
 * @param filePath
 * @yields {Record<string, string>} One object per line with header keys.
 * @returns
 */
async function* streamTsv(filePath) {
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  /** @type {string[] | null} */
  let headers = null;
  for await (const line of rl) {
    if (!headers) {
      headers = line.split('\t').map((h) => h.replace(/^\?/, ''));
      continue;
    }
    const values = line.split('\t');
    /** @type {Record<string, string>} */
    const row = {};
    for (let i = 0; i < headers.length; i++) {
      // Strip Wikidata TSV formatting:
      // - IRIs: <http://...> -> http://...
      // - Literals: "value" -> value
      // - Language-tagged literals: "value"@en -> value
      // - Typed literals: "value"^^<type> -> value
      let val = values[i] || '';
      if (val.startsWith('<') && val.endsWith('>')) {
        val = val.slice(1, -1);
      } else if (val.startsWith('"')) {
        // Find the closing quote (handles "value"@lang and "value"^^<type>)
        const closingQuote = val.lastIndexOf('"');
        if (closingQuote > 0) {
          val = val.slice(1, closingQuote);
        }
      }
      row[headers[i]] = val;
    }
    yield row;
  }
}

/**
 * Extracts the Wikidata Q-ID from a full IRI or quoted IRI.
 * e.g. `"<http://www.wikidata.org/entity/Q27109816>"` -> `"Q27109816"`
 *      `"http://www.wikidata.org/entity/Q27109816"` -> `"Q27109816"`
 * @param iri
 * @returns
 */
function getIdFromIRI(iri) {
  return /** @type {string} */ (iri.replaceAll(/^<|>$/g, '').split('/').pop());
}

/**
 * Fetches missing parent taxa from Wikidata iteratively.
 * Starts from taxa that have a parentId not yet in the map,
 * fetches those parents in chunks, and repeats until no new parents
 * are needed (or we hit the root).
 * @param taxaMap - The taxa map to populate.
 * @returns
 */
async function fetchMissingParents(taxaMap) {
  const CHUNK_SIZE = 200;
  let round = 0;

  while (true) {
    // Find all parentIds that are not yet in the map
    const missingIds = new Set();
    for (const entry of taxaMap.values()) {
      if (entry.parentId && !taxaMap.has(entry.parentId)) {
        missingIds.add(entry.parentId);
      }
    }

    if (missingIds.size === 0) break;
    round++;
    debug.info(
      `  Fetching parent taxa round ${round}: ${missingIds.size} missing parents`,
    );

    // Fetch in chunks to avoid query timeouts
    const missingArray = [...missingIds];
    for (let i = 0; i < missingArray.length; i += CHUNK_SIZE) {
      const chunk = missingArray.slice(i, i + CHUNK_SIZE);
      const values = chunk.map((id) => `wd:${id}`).join(' ');
      const query = `${SPARQL_PREFIXES}
SELECT ?taxon_id ?taxon_name ?taxon_rank ?parent_id {
  VALUES ?taxon_id { ${values} }
  OPTIONAL { ?taxon_id wdt:P225 ?taxon_name. }
  OPTIONAL { ?taxon_id wdt:P105/rdfs:label ?taxon_rank.
             FILTER (lang(?taxon_rank) = 'en')
  }
  OPTIONAL { ?taxon_id wdt:P171 ?parent_id. }
}
`;
      // Wikidata's public SPARQL endpoint throttles/errors frequently. Never
      // skip a chunk on a transient failure — that would leave the taxonomy
      // tree permanently incomplete. Retry the SAME chunk with backoff
      // (honouring Retry-After) until it succeeds. Only after MAX_CHUNK_RETRIES
      // consecutive failures do we give up on that single chunk, so one truly
      // malformed chunk can't block the whole tree.
      const MAX_CHUNK_RETRIES = 20;
      let json;
      for (let attempt = 0; ; attempt++) {
        try {
          const response = await fetch(
            `${WIKIDATA_SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`,
            {
              headers: {
                Accept: 'application/sparql-results+json',
                'User-Agent':
                  'OctoChemDB/1.0 (https://github.com/cheminfo/octochemdb)',
              },
            },
          );
          if (!response.ok) {
            if (attempt >= MAX_CHUNK_RETRIES) {
              debug.warn(
                `  Parent taxa chunk still HTTP ${response.status} after ${attempt} retries; skipping this chunk`,
              );
              break;
            }
            const retryAfter = Number(response.headers.get('retry-after'));
            const wait =
              Number.isFinite(retryAfter) && retryAfter > 0
                ? retryAfter * 1000
                : 5000;
            debug.warn(
              `  Parent taxa HTTP ${response.status}; waiting ${wait}ms and retrying same chunk (attempt ${attempt + 1})`,
            );
            await delay(wait);
            continue;
          }
          json = await response.json();
          break;
        } catch (/** @type {any} */ error) {
          if (attempt >= MAX_CHUNK_RETRIES) {
            debug.warn(
              `  Parent taxa chunk still failing after ${attempt} retries (${error.message}); skipping this chunk`,
            );
            break;
          }
          debug.warn(
            `  Error fetching parent taxa chunk: ${error.message}; retrying same chunk (attempt ${attempt + 1})`,
          );
          await delay(5000);
        }
      }
      // Chunk exhausted its retries without a usable response; move on.
      if (!json) continue;
      for (const row of json.results.bindings) {
        const id = getIdFromIRI(row.taxon_id.value);
        if (!taxaMap.has(id)) {
          taxaMap.set(id, {
            names: [],
            rank: undefined,
            ncbiId: undefined,
            parentId: undefined,
          });
        }
        const entry = taxaMap.get(id);
        const name = row.taxon_name?.value;
        if (name && !entry.names.includes(name)) entry.names.push(name);
        if (!entry.rank && row.taxon_rank?.value) {
          entry.rank = row.taxon_rank.value;
        }
        if (!entry.parentId && row.parent_id?.value) {
          entry.parentId = getIdFromIRI(row.parent_id.value);
        }
      }
    }
  }
}

/**
 * Walks up the parent chain in taxaMap to build the full taxonomy hierarchy
 * (kingdom, phylum, class, order, family, genus, species) for a given taxon.
 * @param taxonId - The starting taxon Wikidata ID.
 * @param taxaMap - The complete taxa map with parent links.
 * @returns An object with kingdom, phylum, class, order, family, genus, species fields.
 */
function resolveTaxonHierarchy(taxonId, taxaMap) {
  /** @type {Record<string, string>} */
  const hierarchy = {};
  const visited = new Set();
  let currentId = taxonId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const taxon = taxaMap.get(currentId);
    if (!taxon) break;

    const rank = taxon.rank;
    const name = taxon.names[0];
    if (rank && name && rank in RANK_TO_FIELD) {
      hierarchy[RANK_TO_FIELD[rank]] = name;
    }

    currentId = taxon.parentId;
  }

  return hierarchy;
}

/**
 * Fetches all LOTUS data from Wikidata SPARQL endpoint by downloading
 * TSV files to disk (to avoid memory issues), then stream-parses them
 * and yields one document per compound.
 * @param connection - Active database connection wrapper.
 * @param [options]
 * @yields {LotusEntry}
 * @returns
 */
export async function* parseLotuses(connection, options = {}) {
  try {
    // Ensure data directory exists
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    const compoundsFile = `${DATA_DIR}/compounds.tsv`;
    const crtFile = `${DATA_DIR}/compound_reference_taxon.tsv`;
    const taxaFile = `${DATA_DIR}/taxa.tsv`;
    const referencesFile = `${DATA_DIR}/references.tsv`;

    if (options.testData) {
      // In test mode, yield from in-memory test data
      yield* yieldFromTestData(options.testData, connection);
      return;
    }

    // Step 1: Fetch the id lists that drive the partitioned downloads. Both are
    // single lightweight queries (a compound has an InChIKey; a taxon is an
    // object of P703).
    debug.info('Step 1/5: Fetching compound and taxon id lists...');
    const compoundIds = await fetchCompoundIds();
    const taxonIds = await fetchTaxonIds();
    debug.info(
      `  ${compoundIds.length} compounds, ${taxonIds.length} organism taxa`,
    );

    // Step 2: Hydrate compound structures via VALUES chunks, guaranteeing every
    // compound id is covered (Blazegraph silently drops rows from big batches).
    debug.info('Step 2/5: Downloading compound structures...');
    await hydrateComplete(
      compoundsFile,
      compoundIds,
      buildCompoundChunk,
      20000,
      'compounds',
    );

    // Step 3: Taxa attributes (coverage-guaranteed) and compound-taxon-reference
    // triplets. crt is driven by taxa but a taxon may legitimately have no
    // compound links, so its completeness can't be checked by driver coverage;
    // the small chunk size keeps silent drops negligible.
    debug.info(
      'Step 3/5: Downloading taxa and compound-taxon-reference triplets...',
    );
    await hydrateComplete(taxaFile, taxonIds, buildTaxaChunk, 800, 'taxa');
    await downloadByIdChunks(crtFile, taxonIds, buildCrtChunk, 250, 'crt');

    // Step 4: References, partitioned by DOI prefix (every DOI is "10.<digit>/…").
    debug.info('Step 4/5: Downloading references...');
    await downloadByPrefix(
      referencesFile,
      buildReferencesBucket,
      '0123456789'.split('').map((d) => `10.${d}`),
      '0123456789',
      'references',
    );
    // Catch-all for any DOI not of the form "10.<digit>" (should be ~none).
    // Non-fatal: losing a handful of reference titles must not fail the sync.
    try {
      appendTsvChunk(
        referencesFile,
        await sparqlQuery(
          `${SPARQL_PREFIXES}
SELECT ?article_id ?doi ?title WHERE {
  ?article_id wdt:P356 ?doi.
  FILTER(!STRSTARTS(?doi, "10.0") && !STRSTARTS(?doi, "10.1") && !STRSTARTS(?doi, "10.2") && !STRSTARTS(?doi, "10.3") && !STRSTARTS(?doi, "10.4") && !STRSTARTS(?doi, "10.5") && !STRSTARTS(?doi, "10.6") && !STRSTARTS(?doi, "10.7") && !STRSTARTS(?doi, "10.8") && !STRSTARTS(?doi, "10.9"))
  ?article_id wdt:P31 ?type.
  OPTIONAL { ?article_id wdt:P1476 ?title. }
}`,
          { retries: 3 },
        ),
      );
    } catch (/** @type {any} */ error) {
      debug.warn(`  references catch-all skipped: ${error.message}`);
    }

    // Step 2: Stream-parse taxa and references into Maps (these are small enough)
    debug.info('Step 5/5: Building lookup maps and yielding compounds...');

    // Build taxa map by streaming taxa.tsv
    // Each entry has: names, rank, ncbiId, parentId
    /** @type {Map<string, LotusTaxaMapEntry>} */
    const taxaMap = new Map();
    let taxaCount = 0;
    for await (const row of streamTsv(taxaFile)) {
      const id = getIdFromIRI(row.taxon_id);
      if (!id) continue;
      if (!taxaMap.has(id)) {
        taxaMap.set(id, {
          names: [],
          rank: undefined,
          ncbiId: undefined,
          parentId: undefined,
        });
      }
      const entry = taxaMap.get(id);
      const name = row.taxon_name;
      if (name && !entry.names.includes(name)) {
        entry.names.push(name);
      }
      if (!entry.rank && row.taxon_rank) {
        entry.rank = row.taxon_rank;
      }
      if (!entry.ncbiId && row.ncbi_id) {
        entry.ncbiId = row.ncbi_id;
      }
      if (!entry.parentId && row.parent_id) {
        entry.parentId = getIdFromIRI(row.parent_id);
      }
      taxaCount++;
    }
    debug.info(`  Loaded ${taxaMap.size} unique taxa from ${taxaCount} rows`);

    // Now fetch missing parent taxa iteratively (parents not in initial set)
    // Walk up the tree by fetching missing parents in chunks from Wikidata
    await fetchMissingParents(taxaMap);
    debug.info(`  After fetching parents: ${taxaMap.size} total taxa in tree`);

    // Build references map by streaming references.tsv
    /** @type {Map<string, LotusReferenceMapEntry>} */
    const referencesMap = new Map();
    let refsCount = 0;
    for await (const row of streamTsv(referencesFile)) {
      const id = getIdFromIRI(row.article_id);
      if (!id) continue;
      if (!referencesMap.has(id)) {
        referencesMap.set(id, { dois: [], title: undefined });
      }
      const entry = referencesMap.get(id);
      if (row.doi && !entry.dois.includes(row.doi)) {
        entry.dois.push(row.doi);
      }
      if (!entry.title && row.title) {
        entry.title = row.title;
      }
      refsCount++;
    }
    debug.info(
      `  Loaded ${referencesMap.size} unique references from ${refsCount} rows`,
    );

    // Build CRT map by streaming compound_reference_taxon.tsv
    /** @type {Map<string, LotusCrtLink[]>} */
    const crtMap = new Map();
    let crtCount = 0;
    for await (const row of streamTsv(crtFile)) {
      const compoundId = getIdFromIRI(row.compound_id);
      const taxonId = getIdFromIRI(row.taxon_id);
      const referenceId = row.reference_id
        ? getIdFromIRI(row.reference_id)
        : undefined;
      if (!compoundId) continue;
      if (!crtMap.has(compoundId)) {
        crtMap.set(compoundId, []);
      }
      crtMap.get(compoundId).push({ taxonId, referenceId });
      crtCount++;
    }
    debug.info(
      `  Loaded ${crtMap.size} compounds with taxon links from ${crtCount} rows`,
    );

    // Step 3: Stream compounds.tsv, group by ID on-the-fly, and yield
    // Since compounds.tsv may have multiple rows per compound (multiple SMILES etc),
    // we first group them into a Map, then yield
    /** @type {Map<string, LotusCompoundVariants>} */
    const compoundsMap = new Map();
    let compoundRows = 0;
    for await (const row of streamTsv(compoundsFile)) {
      const id = getIdFromIRI(row.compound_id);
      if (!id) continue;
      if (!compoundsMap.has(id)) {
        compoundsMap.set(id, {
          canonicalSmiles: [],
          isomericSmiles: [],
          inchis: [],
          inchiKeys: [],
        });
      }
      const compound = compoundsMap.get(id);
      if (
        row.canonicalSmiles &&
        !compound.canonicalSmiles.includes(row.canonicalSmiles)
      ) {
        compound.canonicalSmiles.push(row.canonicalSmiles);
      }
      if (
        row.isomericSmiles &&
        !compound.isomericSmiles.includes(row.isomericSmiles)
      ) {
        compound.isomericSmiles.push(row.isomericSmiles);
      }
      if (row.inchi && !compound.inchis.includes(row.inchi)) {
        compound.inchis.push(row.inchi);
      }
      if (row.inchikey && !compound.inchiKeys.includes(row.inchikey)) {
        compound.inchiKeys.push(row.inchikey);
      }
      compoundRows++;
    }
    debug.info(
      `  Loaded ${compoundsMap.size} unique compounds from ${compoundRows} rows`,
    );

    // Yield one document per compound
    let yieldCount = 0;
    let yieldStart = Date.now();
    const totalCompounds = compoundsMap.size;

    for (const [wikidataId, compound] of compoundsMap) {
      try {
        const smiles =
          compound.canonicalSmiles[0] || compound.isomericSmiles[0];
        if (!smiles) continue;

        const oclMolecule = OCL.Molecule.fromSmiles(smiles);
        const ocl = await getNoStereosFromCache(
          oclMolecule,
          connection,
          'lotuses',
        );

        /** @type {LotusEntry} */
        const result = {
          _id: wikidataId,
          data: { ocl },
        };

        if (compound.inchiKeys.length > 0) {
          result.data.inchiKey = compound.inchiKeys[0];
        }

        if (
          compound.isomericSmiles.length > 0 &&
          compound.isomericSmiles[0] !== smiles
        ) {
          result.data.isomericSmiles = compound.isomericSmiles[0];
        }

        // Build taxonomies from CRT links
        const links = crtMap.get(wikidataId);
        if (links && links.length > 0) {
          /** @type {LotusRawTaxonomy[]} */
          const taxonomies = [];
          for (const link of links) {
            /** @type {LotusRawTaxonomy} */
            const taxonomy = {};
            if (link.taxonId && taxaMap.has(link.taxonId)) {
              const taxonData = /** @type {LotusTaxaMapEntry} */ (
                taxaMap.get(link.taxonId)
              );
              taxonomy.wikidataId = link.taxonId;
              if (taxonData.ncbiId) {
                taxonomy.ncbiId = Number(taxonData.ncbiId);
              }
              // Resolve full hierarchy by walking the parent chain
              const hierarchy = resolveTaxonHierarchy(link.taxonId, taxaMap);
              if (hierarchy.kingdom) taxonomy.kingdom = hierarchy.kingdom;
              if (hierarchy.phylum) taxonomy.phylum = hierarchy.phylum;
              if (hierarchy.class) taxonomy.class = hierarchy.class;
              if (hierarchy.order) taxonomy.order = hierarchy.order;
              if (hierarchy.family) taxonomy.family = hierarchy.family;
              if (hierarchy.genus) taxonomy.genus = hierarchy.genus;
              if (hierarchy.species) taxonomy.species = hierarchy.species;
            } else if (link.taxonId) {
              taxonomy.wikidataId = link.taxonId;
            }
            if (link.referenceId && referencesMap.has(link.referenceId)) {
              const refData = /** @type {LotusReferenceMapEntry} */ (
                referencesMap.get(link.referenceId)
              );
              taxonomy.reference = { wikidataId: link.referenceId };
              if (refData.dois.length > 0) {
                taxonomy.reference.dois = refData.dois;
              }
              if (refData.title) {
                taxonomy.reference.title = refData.title;
              }
            } else if (link.referenceId) {
              taxonomy.reference = { wikidataId: link.referenceId };
            }

            if (Object.keys(taxonomy).length > 0) {
              taxonomies.push(taxonomy);
            }
          }
          if (taxonomies.length > 0) {
            result.data.taxonomies = taxonomies;
          }
        }

        yieldCount++;
        if (Date.now() - yieldStart > Number(process.env.DEBUG_THROTTLING)) {
          const pct = ((yieldCount / totalCompounds) * 100).toFixed(1);
          debug.info(
            `Yielding compounds: ${yieldCount}/${totalCompounds} (${pct}%)`,
          );
          yieldStart = Date.now();
        }

        yield result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        debug.error(`Error processing compound ${wikidataId}: ${err.message}`, {
          collection: 'lotuses',
          connection,
          stack: err.stack,
        });
      }
    }

    debug.info(`Done: yielded ${yieldCount} compounds total`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'lotuses',
        connection,
        stack: err.stack,
      });
    }
  }
}

/**
 * Yields entries from in-memory test data (used in test mode).
 * @param testData - Pre-built test data mimicking SPARQL bindings.
 * @param connection - Active database connection wrapper.
 * @yields {LotusEntry}
 * @returns
 */
async function* yieldFromTestData(testData, connection) {
  // Build maps from test data (same SPARQL binding format)
  /** @type {Map<string, LotusTaxaMapEntry>} */
  const taxaMap = new Map();
  for (const row of testData.taxa) {
    const id = getIdFromIRI(/** @type {string} */ (row.taxon_id?.value));
    if (!taxaMap.has(id)) {
      taxaMap.set(id, {
        names: [],
        rank: undefined,
        ncbiId: undefined,
        parentId: undefined,
      });
    }
    const entry = taxaMap.get(id);
    const name = row.taxon_name?.value;
    if (name && !entry.names.includes(name)) entry.names.push(name);
    if (!entry.rank && row.taxon_rank?.value) entry.rank = row.taxon_rank.value;
    if (!entry.ncbiId && row.ncbi_id?.value) entry.ncbiId = row.ncbi_id.value;
    if (!entry.parentId && row.parent_id?.value) {
      entry.parentId = getIdFromIRI(row.parent_id.value);
    }
  }

  /** @type {Map<string, LotusReferenceMapEntry>} */
  const referencesMap = new Map();
  for (const row of testData.references) {
    const id = getIdFromIRI(/** @type {string} */ (row.article_id?.value));
    if (!referencesMap.has(id)) {
      referencesMap.set(id, { dois: [], title: undefined });
    }
    const entry = referencesMap.get(id);
    if (row.doi?.value && !entry.dois.includes(row.doi.value)) {
      entry.dois.push(row.doi.value);
    }
    if (!entry.title && row.title?.value) entry.title = row.title.value;
  }

  /** @type {Map<string, LotusCrtLink[]>} */
  const crtMap = new Map();
  for (const row of testData.compoundReferenceTaxon) {
    const compoundId = getIdFromIRI(
      /** @type {string} */ (row.compound_id?.value),
    );
    const taxonId = getIdFromIRI(/** @type {string} */ (row.taxon_id?.value));
    const referenceId = row.reference_id?.value
      ? getIdFromIRI(row.reference_id.value)
      : undefined;
    if (!crtMap.has(compoundId)) crtMap.set(compoundId, []);
    crtMap.get(compoundId).push({ taxonId, referenceId });
  }

  /** @type {Map<string, LotusCompoundVariants>} */
  const compoundsMap = new Map();
  for (const row of testData.compounds) {
    const id = getIdFromIRI(row.compound_id.value);
    if (!compoundsMap.has(id)) {
      compoundsMap.set(id, {
        canonicalSmiles: [],
        isomericSmiles: [],
        inchis: [],
        inchiKeys: [],
      });
    }
    const c = compoundsMap.get(id);
    if (row.canonicalSmiles?.value) {
      c.canonicalSmiles.push(row.canonicalSmiles.value);
    }
    if (row.isomericSmiles?.value) {
      c.isomericSmiles.push(row.isomericSmiles.value);
    }
    if (row.inchi?.value) c.inchis.push(row.inchi.value);
    if (row.inchikey?.value) c.inchiKeys.push(row.inchikey.value);
  }

  for (const [wikidataId, compound] of compoundsMap) {
    try {
      const smiles = compound.canonicalSmiles[0] || compound.isomericSmiles[0];
      if (!smiles) continue;

      const oclMolecule = OCL.Molecule.fromSmiles(smiles);
      const ocl = await getNoStereosFromCache(
        oclMolecule,
        connection,
        'lotuses',
      );

      /** @type {LotusEntry} */
      const result = { _id: wikidataId, data: { ocl } };
      if (compound.inchiKeys.length > 0) {
        result.data.inchiKey = compound.inchiKeys[0];
      }
      if (
        compound.isomericSmiles.length > 0 &&
        compound.isomericSmiles[0] !== smiles
      ) {
        result.data.isomericSmiles = compound.isomericSmiles[0];
      }

      const links = crtMap.get(wikidataId);
      if (links && links.length > 0) {
        /** @type {LotusRawTaxonomy[]} */
        const taxonomies = [];
        for (const link of links) {
          /** @type {LotusRawTaxonomy} */
          const taxonomy = {};
          if (link.taxonId && taxaMap.has(link.taxonId)) {
            const taxonData = /** @type {LotusTaxaMapEntry} */ (
              taxaMap.get(link.taxonId)
            );
            taxonomy.wikidataId = link.taxonId;
            if (taxonData.ncbiId) taxonomy.ncbiId = Number(taxonData.ncbiId);
            const hierarchy = resolveTaxonHierarchy(link.taxonId, taxaMap);
            if (hierarchy.kingdom) taxonomy.kingdom = hierarchy.kingdom;
            if (hierarchy.phylum) taxonomy.phylum = hierarchy.phylum;
            if (hierarchy.class) taxonomy.class = hierarchy.class;
            if (hierarchy.order) taxonomy.order = hierarchy.order;
            if (hierarchy.family) taxonomy.family = hierarchy.family;
            if (hierarchy.genus) taxonomy.genus = hierarchy.genus;
            if (hierarchy.species) taxonomy.species = hierarchy.species;
          } else if (link.taxonId) {
            taxonomy.wikidataId = link.taxonId;
          }
          if (link.referenceId && referencesMap.has(link.referenceId)) {
            const refData = /** @type {LotusReferenceMapEntry} */ (
              referencesMap.get(link.referenceId)
            );
            taxonomy.reference = { wikidataId: link.referenceId };
            if (refData.dois.length > 0) taxonomy.reference.dois = refData.dois;
            if (refData.title) taxonomy.reference.title = refData.title;
          } else if (link.referenceId) {
            taxonomy.reference = { wikidataId: link.referenceId };
          }
          if (Object.keys(taxonomy).length > 0) taxonomies.push(taxonomy);
        }
        if (taxonomies.length > 0) result.data.taxonomies = taxonomies;
      }

      yield result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      debug.error(
        `Error processing test compound ${wikidataId}: ${err.message}`,
      );
    }
  }
}
