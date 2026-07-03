import { dirname } from 'node:path';

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
 * @async
 * @param source - Absolute or relative path to the `.gz` input file.
 * @param destination - Path where the sorted plain-text output is
 *   written. The file is created or overwritten.
 * @returns Resolves once the decompress-and-sort pipeline has written the destination file.
 */
export default async function ungzipAndSort(source, destination) {
  debug.trace(`Ungzip and sorting file: ${source}`);
  // `sort` spills large inputs to temporary files. Inside the read-only
  // container /tmp is not writable, so point sort at the destination's
  // directory (which lives on the writable data volume) via -T.
  const tmpDir = dirname(destination);
  const out = await exec(
    `gzip -dc "${source}" | sort -n -T "${tmpDir}" > "${destination}"`,
  );
  debug.trace(out.stdout, { stderr: out.stderr });
}
