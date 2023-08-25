import { createReadStream } from 'fs';
import { createInterface } from 'readline';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('parsePatents');
export default async function importCompoundPatents(filneName, connection) {
  try {
    const temporaryCollection = await connection.getCollection(
      'compoundPatents_tmp',
    );
    const readStream = createReadStream(filneName);
    let entry = [];
    let currentProductID = -1;

    const progress = await connection.getProgress('compoundPatents');
    let start = Date.now();
    let count = 0;
    // ATTENTION:readline.createInterface() will start to consume the input stream once invoked.
    // Having asynchronous operations between interface creation and asynchronous iteration may result in missed lines.
    const lines = createInterface({ input: readStream, crlfDelay: Infinity });
    for await (let line of lines) {
      let fields = line.split('\t');
      if (fields.length !== 2) continue;
      let [productID, patentID] = fields;

      if (currentProductID === -1) {
        currentProductID = Number(productID);
      }
      if (currentProductID !== Number(productID)) {
        entry.sort((a, b) => {
          if (a.startsWith('US') && !b.startsWith('US')) return -1;
          if (!a.startsWith('US') && b.startsWith('US')) return 1;
          return 0;
        });
        count++;

        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(`Imported ${count} patents`);
          start = Date.now();
        }
        await temporaryCollection.updateOne(
          { _id: Number(currentProductID) },
          {
            $set: {
              _id: Number(currentProductID),
              _seq: ++progress.seq,
              data: { patents: entry.slice(0, 10000), nbPatents: entry.length },
            },
          },
          { upsert: true },
        );
        entry.length = 0;
        currentProductID = Number(productID);
      }
      entry.push(patentID);
      if (process.env.NODE_ENV === 'test' && count > 4500) {
        break;
      }
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
    await temporaryCollection.rename('compoundPatents', {
      dropTarget: true,
    });
    await connection.setProgress(progress);
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'compoundPatents',
        connection,
        stack: e.stack,
      });
    }
  }
}
