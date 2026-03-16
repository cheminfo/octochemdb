import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('getTaxonomiesNodes');

/**
 * Parses the NCBI `nodes.dmp` file from its binary representation and
 * builds a lookup map from taxonomy ID to rank string.
 *
 * The file format is pipe-delimited with the layout:
 * `tax_id | parent_tax_id | rank | ...`
 * Each line is terminated by a newline (`0x0A`).  The function scans the
 * byte array character-by-character for performance, splitting each line
 * on `|` to extract `tax_id` (field 0) and `rank` (field 2).
 *
 * @param {ArrayBuffer} arrayBuffer - Raw binary content of `nodes.dmp`.
 * @param {OctoChemConnection} [connection] - Optional database connection
 *   used exclusively for fatal error logging.
 * @returns {Promise<TaxonomyNodesMap | undefined>} A `taxID → rank` lookup map,
 *   or `undefined` if an error is caught.
 */
export async function getTaxonomiesNodes(arrayBuffer, connection) {
  try {
    const decoder = new TextDecoder();
    const bytes = new Uint8Array(arrayBuffer);
    let begin = 0;
    let end = 0;
    /** @type {TaxonomyNodesMap} */
    const result = {};

    // Scan byte-by-byte looking for newlines (0x0A)
    while (end < bytes.length) {
      if (bytes[end] === 10) {
        const line = decoder.decode(bytes.subarray(begin, end));
        // Split on pipe + surrounding whitespace
        const fields = line.split(/[\t ]*\|[ \t]*/);

        if (fields.length < 2) {
          end++;
          continue;
        }

        // Extract tax_id (field 0) and rank (field 2)
        const taxId = fields[0].replace(/[\r\n]/g, '');
        result[taxId] = fields[2];
        begin = end;
      }
      end++;
    }

    return result;
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
