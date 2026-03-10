import { exec } from 'node-exec-promise';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('ungzipAndSort');

/**
 * Decompresses a gzipped file and sorts its lines numerically, writing the
 * result to a destination file.
 *
 * Uses a shell pipeline (`gzip -dc | sort -n`) so the decompression and sort
 * run as separate OS processes, keeping Node.js memory usage minimal even for
 * very large files.
 *
 * The output file is required to be sorted numerically by the first column
 * (CID) because `importCompoundPatents` groups consecutive lines by CID and
 * relies on them arriving in order.
 *
 * @async
 * @param {string} source - Absolute or relative path to the `.gz` input file.
 * @param {string} destination - Path where the sorted plain-text output is
 *   written. The file is created or overwritten.
 * @returns {Promise<void>}
 */
export default async function ungzipAndSort(source, destination) {
  debug.trace(`Ungzip and sorting file: ${source}`);
  // sort --parallel 8
  return exec(`gzip -dc "${source}" | sort -n  > "${destination}"`).then(
    (out) => {
      debug.trace(out.stdout, { stderr: out.stderr });
    },
    (err) => {
      debug.error(err);
    },
  );
}
