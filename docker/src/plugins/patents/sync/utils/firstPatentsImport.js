import { createReadStream } from 'fs';
import { createInterface } from 'readline';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('parsePatents');
export default async function firstPatentsImport(filneName, connection) {
  try {
    const temporaryCollection = await connection.getCollection('patents_tmp');
    debug(filneName);
    const readStream = createReadStream(filneName);
    const lines = createInterface({ input: readStream });
    let entry = [];
    let currentProductID = -1;

    const progress = await connection.getProgress('patents');

    for await (const line of lines) {
      debug(line);
      let fields = line.split('\t');
      if (fields.length !== 2) continue;
      let [productID, patentID] = fields;

      patentID = patentID.replace(/-/g, '');
      if (currentProductID === -1) {
        currentProductID = Number(productID);
      }
      if (currentProductID !== Number(productID)) {
        entry.sort((a, b) => {
          if (a.startsWith('US') && !b.startsWith('US')) return -1;
          if (!a.startsWith('US') && b.startsWith('US')) return 1;
          return 0;
        });
        await temporaryCollection.updateOne(
          { _id: Number(currentProductID) },
          {
            $set: {
              _id: Number(currentProductID),
              _seq: ++progress.seq,
              data: { patents: entry.slice(0, 1000), nbPatents: entry.length },
            },
          },
          { upsert: true },
        );
        entry.length = 0;
        currentProductID = Number(productID);
      }
      entry.push(patentID);
    }
    if (entry.length) {
      entry.sort((a, b) => {
        if (a.startsWith('US') && !b.startsWith('US')) return -1;
        if (!a.startsWith('US') && b.startsWith('US')) return 1;
        return 0;
      });
      // use updateOne instead of insertOne to avoid duplicate key error
      await temporaryCollection.updateOne(
        { _id: Number(currentProductID) },
        {
          $set: {
            _id: Number(currentProductID),
            _seq: ++progress.seq,
            data: { patents: entry.slice(0, 1000), nbPatents: entry.length },
          },
        },
        { upsert: true },
      );
    }
    await temporaryCollection.rename('patents', {
      dropTarget: true,
    });
    await connection.setProgress(progress);
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'patents', connection, stack: e.stack });
    }
  }
}
