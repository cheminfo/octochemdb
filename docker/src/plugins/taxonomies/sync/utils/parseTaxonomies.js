import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('parseTaxonomies');

/**
 * Generator that parses the NCBI `rankedlineage.dmp` file and yields
 * taxonomy entries suitable for database insertion.
 *
 * Each pipe-delimited line contains:
 * `tax_id | tax_name | species | genus | family | order | class | phylum | kingdom | superkingdom`
 *
 * The function populates a `TaxonomyData` object with non-empty rank
 * values.  When `tax_name` (field 1) is present, it additionally uses
 * the `nodes` lookup to resolve the organism’s rank and stores the name
 * under the matching rank key.
 *
 * @param {ArrayBuffer} arrayBuffer - Raw binary content of `rankedlineage.dmp`.
 * @param {TaxonomyNodesMap} nodes - Mapping from taxonomy ID to rank string,
 *   as produced by `getTaxonomiesNodes`.
 * @param {OctoChemConnection} [connection] - Optional database connection
 *   used exclusively for fatal error logging.
 * @yields {TaxonomyEntry} A document with `_id` (numeric tax ID) and `data`
 *   (the resolved taxonomy ranks).
 */
export async function* parseTaxonomies(arrayBuffer, nodes, connection) {
  try {
    const decoder = new TextDecoder();
    const bytes = new Uint8Array(arrayBuffer);
    let begin = 0;
    let end = 0;

    // Scan byte-by-byte for newline characters (0x0A)
    while (end < bytes.length) {
      if (bytes[end] === 10) {
        const line = decoder.decode(bytes.subarray(begin, end));

        const fields = line.split(/[\t ]*\|[ \t]*/);
        // Skip malformed lines with fewer than 2 fields
        if (fields.length < 2) {
          end++;
          continue;
        }

        // Build taxonomy data from ranked lineage fields
        /** @type {TaxonomyData} */
        const taxonomy = {};
        if (fields[9] !== '') {
          taxonomy.superkingdom = fields[9];
        }
        if (fields[8] !== '') {
          taxonomy.kingdom = fields[8];
        }
        if (fields[7] !== '') {
          taxonomy.phylum = fields[7];
        }
        if (fields[6] !== '') {
          taxonomy.class = fields[6];
        }
        if (fields[5] !== '') {
          taxonomy.order = fields[5];
        }
        if (fields[4] !== '') {
          taxonomy.family = fields[4];
        }
        if (fields[3] !== '') {
          taxonomy.genus = fields[3];
        }
        if (fields[2] !== '') {
          taxonomy.species = fields[2];
        }
        // When tax_name (field 1) is present, resolve the organism rank
        // from the nodes lookup and store the name under the matching key
        if (fields[1] !== '') {
          const taxId = Number(fields[0]);
          const rank = nodes[taxId];

          if (
            [
              'superkingdom',
              'species',
              'genus',
              'class',
              'phylum',
              'family',
              'kingdom',
            ].includes(rank)
          ) {
            taxonomy[rank] = fields[1];
          }
        }
        // Compose the final entry with numeric taxonomy ID
        /** @type {TaxonomyEntry} */
        const entry = {
          _id: Number(fields[0].replace(/[\r\n]/g, '')),
          data: taxonomy,
        };

        yield entry;
        begin = end;
      }
      end++;
    }
  } catch (e) {
    if (connection) {
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'taxonomies',
        connection,
        stack: err.stack,
      });
    }
  }
}
