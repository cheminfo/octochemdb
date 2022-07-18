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
    for await (const line of lines) {
      let fields = line.split('\t');
      if (!fields.length === 2) continue;
      const [productID, patentID] = fields;
      if (!entry[productID]) {
        collection.insertOne({
          _id: Number(productID),
          patents: entry[productID],
        });
        entry = {};
        entry[productID] = [];
      }
      debug(entry[productID]);
      entry[productID].push(Number(patentID));
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'patents', connection, stack: e.stack });
    }
  }
}
