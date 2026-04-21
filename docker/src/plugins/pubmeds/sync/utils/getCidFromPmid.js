import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import debugLibrary from '../../../../utils/Debug.js';

/**
 * Builds a PMID → CID[] lookup map from the PubChem CID-PMID gzipped
 * tab-separated file.
 *
 * Each line of the input contains `CID\tPMID`.  The function inverts
 * the mapping so that each PMID key holds an array of associated CIDs.
 *
 * PMIDs associated with more than 1 000 CIDs are dropped entirely
 * (they are typically too generic to be informative).
 *
 * @param {string} filePath - Path to the `CID-PMID.gz` file.
 * @param {OctoChemConnection} connection - Active database connection
 *   (used only for error logging on failure).
 * @returns {Promise<Record<string, number[]> | undefined>} PMID → CID[]
 *   map, or `undefined` if a fatal error occurred.
 */
export async function getCidFromPmid(filePath, connection) {
  const debug = debugLibrary('getCidFromPmid');
  try {
    const readStream = createReadStream(filePath);
    const stream = readStream.pipe(createGunzip());
    /** @type {Record<string, number[]>} */
    const data = {};

    let date = Date.now();
    let counter = 0;
    const lines = createInterface({ input: stream });

    for await (const line of lines) {
      counter++;
      const [cid, pmid] = line.split('\t');
      if (!data[pmid]) {
        data[pmid] = [];
      }
      data[pmid].push(Number(cid));

      // Throttled progress logging
      if (Date.now() - date > Number(process.env.DEBUG_THROTTLING)) {
        date = Date.now();
        debug.trace(
          `Processed PMIDs:${
            Object.keys(data).length
          }, CIDs processed: ${counter}`,
        );
      }
    }

    // Drop overly-generic PMIDs that reference more than 1 000 compounds
    for (const key in data) {
      if (data[key].length > 1000) {
        data[key].length = 0;
      }
    }

    return data;
  } catch (e) {
    if (connection) {
      const err = e instanceof Error ? e : new Error(String(e));
      await debug.fatal(err.message, {
        collection: 'pubmeds',
        connection,
        stack: err.stack,
      });
    }
  }
}
