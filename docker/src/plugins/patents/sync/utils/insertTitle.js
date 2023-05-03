import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('insertTitle');
export default async function insertTitle(filneName, connection) {
  try {
    const temporaryCollection = await connection.getCollection('patents_tmp');
    const readStream = createReadStream(filneName);
    const stream = readStream.pipe(createGunzip());
    const lines = createInterface({ input: stream });
    let start = Date.now();
    let count = 0;

    for await (const line of lines) {
      let entry = {};
      let fields = line.split('\t');
      //   debug(fields);
      if (fields.length !== 3) continue;
      // PATENT ID
      let regex = /patent:(?<temp1>.*)/;
      let patentID = fields[0].match(regex).groups.temp1;
      patentID = patentID.replace(/-/g, '');
      // TITLE
      regex = /"(?<temp1>.*)"/;
      let title = fields[2].match(regex).groups.temp1;

      if (patentID && title) {
        entry._id = patentID;
        entry.data = {};
        entry.data.title = title;
      }
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
        debug(`Tiles parsed ${count}`);
        start = Date.now();
      }
      count++;
      if (!entry._id) continue;
      await temporaryCollection.updateOne(
        { _id: entry._id },
        { $set: entry },
        { upsert: true },
      );
    }
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'patents',
        connection,
        stack: e.stack,
      });
    }
  }
}
