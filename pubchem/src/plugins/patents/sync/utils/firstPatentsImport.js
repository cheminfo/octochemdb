import { createReadStream } from 'fs';

import split2 from 'split2';

import Debug from '../../../../utils/Debug.js';

const debug = Debug('parsePatents');
export default async function firstPatentsImport(
  filneName,
  collection,
  connection,
) {
  try {
    const readStream = createReadStream(filneName).pipe(split2('\n'));
    let entry = {};
    for await (const line of readStream) {
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
      entry[productID].push(patentID);
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'patents', connection, stack: e.stack });
    }
  }
}
