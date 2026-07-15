import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { createGunzip } from 'node:zlib';

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
 * @param filePath - Path to the `CID-PMID.gz` file.
 * @param connection - Active database connection
 *   (used only for error logging on failure).
 * @returns PMID → CID[] map. Throws if the file cannot be read or is not a
 *   valid/complete gzip (rather than silently returning `undefined`).
 */
export async function getCidFromPmid(filePath, connection) {
  const debug = debugLibrary('getCidFromPmid');
  try {
    const readStream = createReadStream(filePath);
    const gunzip = createGunzip();
    // Forward source-stream errors (e.g. ENOENT/EISDIR) into the gunzip stream
    // so the `for await` below rejects and they are caught here, instead of
    // surfacing as an unhandled 'error' event that hard-aborts the process.
    readStream.on('error', (streamError) => gunzip.destroy(streamError));
    const stream = readStream.pipe(gunzip);
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
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    // A truncated or non-gzip file throws here (Z_BUF_ERROR "unexpected end of
    // file" / Z_DATA_ERROR "incorrect header check"). Name the file and the
    // real cause, then RETHROW: returning undefined would let every article
    // crash later on `pmidToCid[pmid]` and the import be falsely marked done.
    const message = `Failed to build PMID→CID map from ${filePath}: ${err.message}`;
    if (connection) {
      await debug.fatal(message, {
        collection: 'pubmeds',
        connection,
        stack: err.stack,
      });
    }
    throw new Error(message, { cause: error });
  }
}
