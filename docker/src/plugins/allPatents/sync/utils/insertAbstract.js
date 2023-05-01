import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('insertAbstract');
export default async function insertAbstract(filneName, connection) {
  try {
    const temporaryCollection = await connection.getCollection(
      'allPatents_tmp',
    );
    const readStream = createReadStream(filneName);
    const stream = readStream.pipe(createGunzip());
    const lines = createInterface({ input: stream });
    let start = Date.now();
    let count = 0;
    for await (const line of lines) {
      let fields = line.split('\t');
      if (fields.length !== 3) continue;
      // PATENT ID
      let regex = /patent:(?<temp1>.*)/;
      let patentID = fields[0].match(regex).groups.temp1;
      patentID = patentID.replace(/-/g, '');
      // ABSTRACT
      regex = /"(?<temp1>.*)"/;
      let abstract = fields[2].match(regex).groups.temp1;
      if (patentID && abstract) {
        let entry = {};
        entry._id = patentID;
        entry.data = {};
        entry.data.abstract = abstract;
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug(`Abstracts parsed ${count}`);
          start = Date.now();
          count = 0;
        }
        count++;
        // insert abstract without deleting the previous data
        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: { 'data.abstract': entry.data.abstract } },
          { upsert: true },
        );
      } else {
        continue;
      }
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'patents', connection, stack: e.stack });
    }
  }
}
