import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { createInterface } from 'readline';

import OCL from 'openchemlib';

import debugLibrary from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

const debug = debugLibrary('parseLotusesV2');

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

const QUERY_COMPOUNDS = `${SPARQL_PREFIXES}
SELECT ?compound_id ?inchikey ?inchi ?canonicalSmiles ?isomericSmiles {
  ?compound_id wdt:P235 ?inchikey.
  OPTIONAL { ?compound_id wdt:P234 ?inchi. }
  OPTIONAL { ?compound_id wdt:P233 ?canonicalSmiles. }
  OPTIONAL { ?compound_id wdt:P2017 ?isomericSmiles. }
}
`;

const QUERY_COMPOUND_TAXON_REF = `${SPARQL_PREFIXES}
SELECT DISTINCT ?compound_id ?taxon_id ?reference_id
WHERE {
  ?compound_id     p:P703 ?pp703.
  ?pp703           ps:P703 ?taxon_id;
                   prov:wasDerivedFrom/pr:P248 ?reference_id.
}
`;

/**
 * Query to get taxon information with NCBI ID, parent taxon, and rank.
 * The parent_id (P171) allows building the full taxonomy tree locally.
 * Returns: taxon_id, taxon_name, taxon_rank, ncbi_id, parent_id
 */
const QUERY_TAXA = `${SPARQL_PREFIXES}
SELECT DISTINCT ?taxon_id ?taxon_name ?taxon_rank ?ncbi_id ?parent_id {
  ?something wdt:P703 ?taxon_id.
  OPTIONAL { ?taxon_id wdt:P225 ?taxon_name. }
  OPTIONAL { ?taxon_id wdt:P105/rdfs:label ?taxon_rank.
             FILTER (lang(?taxon_rank) = 'en')
  }
  OPTIONAL { ?taxon_id wdt:P685 ?ncbi_id. }
  OPTIONAL { ?taxon_id wdt:P171 ?parent_id. }
}
`;

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

const QUERY_REFERENCES = `${SPARQL_PREFIXES}
SELECT ?article_id ?doi ?title {
    ?article_id wdt:P31 ?type;
                wdt:P356 ?doi.
    OPTIONAL { ?article_id wdt:P1476 ?title. }
}
`;

const DATA_DIR = '../originalData/lotusesV2';

/**
 * Downloads a SPARQL query result as TSV and streams it to a local file.
 *
 * @param {string} query - The SPARQL query.
 * @param {string} filePath - Where to write the TSV file.
 * @param {number} [retries=3] - Number of retries on failure.
 * @returns {Promise<void>}
 */
async function downloadSparqlToFile(query, filePath, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000 * 1800); // 30 min timeout
      const response = await fetch(
        `${WIKIDATA_SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Accept: 'text/tab-separated-values',
            'User-Agent':
              'OctoChemDB/1.0 (https://github.com/cheminfo/octochemdb)',
          },
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(
          `SPARQL query failed: ${response.status} ${response.statusText}`,
        );
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Stream response body directly to disk
      const writer = createWriteStream(filePath);
      const reader = response.body.getReader();
      let bytesWritten = 0;
      let lastLog = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        writer.write(Buffer.from(value));
        bytesWritten += value.length;
        if (Date.now() - lastLog > 10000) {
          debug.info(
            `  Downloading... ${(bytesWritten / 1024 / 1024).toFixed(1)} MB written to ${filePath}`,
          );
          lastLog = Date.now();
        }
      }

      await new Promise((resolve, reject) => {
        writer.end(() => resolve(undefined));
        writer.on('error', reject);
      });

      debug.info(
        `  Download complete: ${(bytesWritten / 1024 / 1024).toFixed(1)} MB -> ${filePath}`,
      );
      return;
    } catch (/** @type {any} */ e) {
      debug.warn(`  Attempt ${attempt + 1}/${retries} failed: ${e.message}`);
      if (attempt === retries - 1) throw e;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
}

/**
 * Streams a TSV file line by line, yielding parsed objects.
 * The first line is used as headers.
 *
 * @param {string} filePath
 * @yields {Record<string, string>} One object per line with header keys.
 * @returns {AsyncGenerator<Record<string, string>>}
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
 *
 * @param {string} iri
 * @returns {string}
 */
function getIdFromIRI(iri) {
  return /** @type {string} */ (iri.replace(/^<|>$/g, '').split('/').pop());
}

/**
 * Fetches missing parent taxa from Wikidata iteratively.
 * Starts from taxa that have a parentId not yet in the map,
 * fetches those parents in chunks, and repeats until no new parents
 * are needed (or we hit the root).
 *
 * @param {Map<string, LotusV2TaxaMapEntry>} taxaMap - The taxa map to populate.
 * @returns {Promise<void>}
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
          debug.warn(`  Parent taxa query failed: ${response.status}`);
          continue;
        }
        const json = await response.json();
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
      } catch (/** @type {any} */ e) {
        debug.warn(`  Error fetching parent taxa chunk: ${e.message}`);
      }
    }
  }
}

/**
 * Walks up the parent chain in taxaMap to build the full taxonomy hierarchy
 * (kingdom, phylum, class, order, family, genus, species) for a given taxon.
 *
 * @param {string} taxonId - The starting taxon Wikidata ID.
 * @param {Map<string, LotusV2TaxaMapEntry>} taxaMap - The complete taxa map with parent links.
 * @returns {Record<string, string>} An object with kingdom, phylum, class, order, family, genus, species fields.
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
 *
 * @param {OctoChemConnection} connection - Active database connection wrapper.
 * @param {LotusV2ParserOptions} [options]
 * @yields {LotusV2Entry}
 * @returns {AsyncGenerator<LotusV2Entry>}
 */
export async function* parseLotusesV2(connection, options = {}) {
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

    // Step 1: Download all 4 SPARQL results to disk as TSV
    debug.info('Step 1/5: Downloading compounds from Wikidata...');
    await downloadSparqlToFile(QUERY_COMPOUNDS, compoundsFile);

    debug.info('Step 2/5: Downloading compound-taxon-reference triplets...');
    await downloadSparqlToFile(QUERY_COMPOUND_TAXON_REF, crtFile);

    debug.info('Step 3/5: Downloading taxa...');
    await downloadSparqlToFile(QUERY_TAXA, taxaFile);

    debug.info('Step 4/5: Downloading references...');
    await downloadSparqlToFile(QUERY_REFERENCES, referencesFile);

    // Step 2: Stream-parse taxa and references into Maps (these are small enough)
    debug.info('Step 5/5: Building lookup maps and yielding compounds...');

    // Build taxa map by streaming taxa.tsv
    // Each entry has: names, rank, ncbiId, parentId
    /** @type {Map<string, LotusV2TaxaMapEntry>} */
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
    /** @type {Map<string, LotusV2ReferenceMapEntry>} */
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
    /** @type {Map<string, LotusV2CrtLink[]>} */
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
    /** @type {Map<string, LotusV2CompoundVariants>} */
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
          'lotusesV2',
        );

        /** @type {LotusV2Entry} */
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
          /** @type {LotusV2RawTaxonomy[]} */
          const taxonomies = [];
          for (const link of links) {
            /** @type {LotusV2RawTaxonomy} */
            const taxonomy = {};
            if (link.taxonId && taxaMap.has(link.taxonId)) {
              const taxonData = /** @type {LotusV2TaxaMapEntry} */ (
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
              const refData = /** @type {LotusV2ReferenceMapEntry} */ (
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
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        debug.error(`Error processing compound ${wikidataId}: ${err.message}`, {
          collection: 'lotusesV2',
          connection,
          stack: err.stack,
        });
      }
    }

    debug.info(`Done: yielded ${yieldCount} compounds total`);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (connection) {
      await debug.fatal(err.message, {
        collection: 'lotusesV2',
        connection,
        stack: err.stack,
      });
    }
  }
}

/**
 * Yields entries from in-memory test data (used in test mode).
 *
 * @param {LotusV2TestData} testData - Pre-built test data mimicking SPARQL bindings.
 * @param {OctoChemConnection} connection - Active database connection wrapper.
 * @yields {LotusV2Entry}
 * @returns {AsyncGenerator<LotusV2Entry>}
 */
async function* yieldFromTestData(testData, connection) {
  // Build maps from test data (same SPARQL binding format)
  /** @type {Map<string, LotusV2TaxaMapEntry>} */
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

  /** @type {Map<string, LotusV2ReferenceMapEntry>} */
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

  /** @type {Map<string, LotusV2CrtLink[]>} */
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

  /** @type {Map<string, LotusV2CompoundVariants>} */
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
        'lotusesV2',
      );

      /** @type {LotusV2Entry} */
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
        /** @type {LotusV2RawTaxonomy[]} */
        const taxonomies = [];
        for (const link of links) {
          /** @type {LotusV2RawTaxonomy} */
          const taxonomy = {};
          if (link.taxonId && taxaMap.has(link.taxonId)) {
            const taxonData = /** @type {LotusV2TaxaMapEntry} */ (
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
            const refData = /** @type {LotusV2ReferenceMapEntry} */ (
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
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      debug.error(
        `Error processing test compound ${wikidataId}: ${err.message}`,
      );
    }
  }
}
