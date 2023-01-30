import { exec } from 'node-exec-promise';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('ungzipAndSort');
export default async function ungzipAndSort(source, destination) {
  debug(`Ungzip and sorting file: ${source}`);
  // sort --parallel 8
  return exec(`gzip -dc "${source}" | sort -n  > "${destination}"`).then(
    (out) => {
      debug(out.stdout, out.stderr);
    },
    (err) => {
      debug(err);
    },
  );
}
