import { existsSync } from 'fs';

import { exec } from 'node-exec-promise';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('ungzipAndSort');
export default async function ungzipGrepAndSort(source, destination) {
  if (existsSync(destination)) {
    debug(`File ${destination} already exists, skipping`);
    return;
  }
  debug(`Ungzip and sorting file: ${source}`);

  // after 2010 GNU sort is already executed in parallel
  return exec(
    `gzip -dc "${source}" | grep $'\tUS'| sort -k2 -d  > "${destination}"`,
  ).then(
    (out) => {
      debug(out.stdout, out.stderr);
    },
    (err) => {
      debug(err);
    },
  );
}
