import { createReadStream } from 'fs';
import { createInterface } from 'readline';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('importTitleCompounds');
export default async function importTitleCompounds(filneName, connection) {
  try {
    const temporaryCollection = await connection.getCollection(
      'titleCompounds_tmp',
    );
    const readStream = createReadStream(filneName);

    const progress = await connection.getProgress('titleCompounds');
    let start = Date.now();
    let count = 0;
    const lines = createInterface({ input: readStream });
    for await (const line of lines) {
      let fields = line.split('\t');
      if (fields.length !== 2) continue;
      let [productID, titleProduct] = fields;

      count++;
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
        debug.trace(`Imported ${count} compounds title`);
        start = Date.now();
      }
      await temporaryCollection.updateOne(
        { _id: Number(productID) },
        {
          $set: {
            _id: Number(productID),
            data: { title: titleProduct },
          },
        },
        { upsert: true },
      );
    }

    await temporaryCollection.rename('titleCompounds', {
      dropTarget: true,
    });
    await connection.setProgress(progress);
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'titleCompounds',
        connection,
        stack: e.stack,
      });
    }
  }
}
