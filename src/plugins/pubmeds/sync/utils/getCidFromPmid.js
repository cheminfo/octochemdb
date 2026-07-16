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
 *
 * The result is a `Map` keyed by the numeric PMID — NOT a plain object.
 * PubChem PMIDs now exceed 134 217 728 (2**27), and a plain object with
 * numeric keys stores them in V8's integer-indexed "elements" backing store,
 * whose maximum size is one `FixedArray` (~2**27 on 64-bit). Growing that
 * backing store past the limit throws `RangeError: Invalid array length`. A
 * `Map` hashes its keys instead, so it has no such ceiling.
 * @param filePath - Path to the `CID-PMID.gz` file.
 * @param connection - Active database connection
 *   (used only for error logging on failure).
 * @returns A `Map<number, number[] | null>` from PMID to its CIDs. Throws if
 *   the file cannot be read or is not a valid/complete gzip (rather than
 *   silently returning `undefined`).
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
    /**
     * PMID → CID[] map. Keyed by the numeric PMID; `null` tombstones an
     * over-capped PMID. A `Map` is mandatory here (not a plain object): PMIDs
     * exceed 2**27 and a numeric-keyed object overflows V8's elements backing
     * store — see the function doc comment.
     * @type {Map<number, number[] | null>}
     */
    const data = new Map();

    // PMIDs that reference more than this many CIDs are too generic to be
    // useful and are dropped. Enforce the cap DURING ingestion, not after: a
    // handful of PMIDs (database-dump references) map to tens of millions of
    // CIDs, and letting a single array grow unbounded spikes memory. Once a
    // PMID crosses the cap we tombstone it with `null` so we stop collecting and
    // never re-grow the array. Consumers treat a missing or falsy entry as
    // "no compounds", so `null` is handled like a dropped PMID.
    const MAX_CIDS_PER_PMID = 1000;

    let date = Date.now();
    let counter = 0;
    const lines = createInterface({ input: stream });

    for await (const line of lines) {
      counter++;
      const [cid, pmid] = line.split('\t');
      // Normalise the key to a Number so lookups match: consumers key by the
      // PMID as parsed from XML (a number), while `split` yields a string.
      const key = Number(pmid);
      const cids = data.get(key);
      if (cids === undefined) {
        data.set(key, [Number(cid)]);
      } else if (cids === null) {
        // Already over the cap and dropped — ignore further CIDs.
        continue;
      } else if (cids.length >= MAX_CIDS_PER_PMID) {
        // Crossed the cap: drop this PMID entirely.
        data.set(key, null);
      } else {
        cids.push(Number(cid));
      }

      // Throttled progress logging
      if (Date.now() - date > Number(process.env.DEBUG_THROTTLING)) {
        date = Date.now();
        debug.trace(`Processed PMIDs:${data.size}, CIDs processed: ${counter}`);
      }
    }

    return data;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    // A truncated or non-gzip file throws here (Z_BUF_ERROR "unexpected end of
    // file" / Z_DATA_ERROR "incorrect header check"). Name the file and the
    // real cause, then RETHROW: returning undefined would let every article
    // crash later on `pmidToCid.get(pmid)` and the import be falsely marked done.
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
