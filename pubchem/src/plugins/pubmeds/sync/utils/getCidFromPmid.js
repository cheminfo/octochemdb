import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import Debug from '../../../../utils/Debug.js';

/**
 * @description Get compound ID from PMID mapping
 * @param {*} filePath Path to the file CIDtoPMID
 * @returns {Promise} Returns object { PMID: [CIDs] }
 */
export async function getCidFromPmid(filePath, connection) {
  const debug = Debug('getCidFromPmid');
  try {
    const readStream = createReadStream(filePath);
    const stream = readStream.pipe(createGunzip());
    const lines = createInterface({ input: stream });

    const data = {};

    let date = Date.now();
    let counter = 0;

    for await (let line of lines) {
      counter++;
      const [cid, pmid] = line.split('\t');
      if (!data[pmid]) {
        data[pmid] = [];
      }
      data[pmid].push(Number(cid));
      if (Date.now() - date > 10000) {
        date = Date.now();
        debug(
          `Processed PMIDs:${
            Object.keys(data).length
          }, CIDs processed: ${counter}`,
        );
      }
    }
    for (let key in data) {
      if (data[key].length > 500) {
        data[key].length = 0;
      }
    }

    return data;
  } catch (error) {
    if (connection) {
      debug(error);
    }
  }
}
