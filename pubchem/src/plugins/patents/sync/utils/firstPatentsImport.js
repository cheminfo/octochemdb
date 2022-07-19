import { createReadStream } from 'fs';
import { createInterface } from 'readline';

import Debug from '../../../../utils/Debug.js';

const debug = Debug('parsePatents');
export default async function firstPatentsImport(filneName, connection) {
  try {
    const temporaryCollection = await connection.getCollection('patents_tpm');
    const readStream = createReadStream(filneName);
    const lines = createInterface({ input: readStream });
    let entry = [];
    let currentProductID = -1;
    let counter = 0;
    let start = Date.now();
    let timeStartTenThousand = Date.now();
    for await (const line of lines) {
      let fields = line.split('\t');
      if (!fields.length === 2) continue;
      const [productID, patentID] = fields;
      if (currentProductID === -1) {
        currentProductID = Number(productID);
      }
      if (currentProductID !== Number(productID)) {
        await temporaryCollection.insertOne({
          _id: Number(currentProductID),
          data: { patents: entry.slice(0, 1000), nbPatents: entry.length },
        });
        entry.length = 0;
        currentProductID = Number(productID);
        counter++;
        if (counter % 10000 === 0) {
          const timeEndTenThousand = Date.now();
          debug(`Time: ${timeEndTenThousand - timeStartTenThousand}`);
          timeStartTenThousand = Date.now();
        }
      }
      entry.push(patentID);
      if (Date.now() - start > 10000) {
        start = Date.now();
        debug(`Processed: ${counter} compounds`);
      }
    }
    if (entry.length) {
      await temporaryCollection.insertOne({
        _id: Number(currentProductID),
        data: { patents: entry.slice(0, 1000), nbPatents: entry.length },
      });
    }
    await temporaryCollection.rename('patents', {
      dropTarget: true,
    });
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'patents', connection, stack: e.stack });
    }
  }
}
