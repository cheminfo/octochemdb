import { createReadStream } from 'fs';
import { createInterface } from 'readline';

import Debug from '../../../../utils/Debug.js';

const debug = Debug('parsePatents');
export default async function firstPatentsImport(
  filneName,
  collection,
  connection,
) {
  try {
    const readStream = createReadStream(filneName);
    const lines = createInterface({ input: readStream });
    let entry = {};
    let currentID = 1;
    let counter = 0;
    let start = Date.now();
    for await (const line of lines) {
      let fields = line.split('\t');
      if (!fields.length === 2) continue;
      const [productID, patentID] = fields;
      // if array size is greater than 500, skip till next productID
      if (!entry[productID]) {
        if (currentID !== Number(productID)) {
          collection.updateOne(
            { _id: Number(currentID) },
            { $set: { data: entry[currentID] } },
            { upsert: true },
          );
          delete entry[currentID];
          currentID = Number(productID);
          counter++;
        }
        entry[productID] = [];
      }
      if (entry[productID].length > 500) {
        continue;
      }
      entry[productID].push(patentID);
      if (Date.now() - start > 10000) {
        start = Date.now();
        debug(`Processed: ${counter} compounds`);
      }
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'patents', connection, stack: e.stack });
    }
  }
}
