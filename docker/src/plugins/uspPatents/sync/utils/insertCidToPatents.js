import { createReadStream } from 'fs';
import { createInterface } from 'readline';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('insertCidToPatents');

export async function insertCidToPatents(patentIDToCid, connection) {
  try {
    const readStream = createReadStream(patentIDToCid);
    const lines = createInterface({ input: readStream });
    const collection = await connection.getCollection('uspPatents');
    let entry = [];
    let currentPatentID = 'start';
    let count = 0;
    let start = Date.now();
    for await (const line of lines) {
      let fields = line.split('\t');
      if (fields.length !== 2) continue;
      let [compoundID, patentID] = fields;
      patentID = patentID.replace(/-/g, '');
      if (currentPatentID === 'start') {
        currentPatentID = patentID;
      }

      if (currentPatentID !== patentID) {
        let uspEntry = await collection
          .find({ _id: currentPatentID })
          .limit(1)
          .next();

        if (uspEntry === null) {
          entry.length = 0;
          currentPatentID = patentID;
          entry.push(Number(compoundID));
          continue;
        }
        uspEntry.data.cids = entry.slice(0, 1000);
        collection.updateOne(
          { _id: uspEntry._id },
          { $set: uspEntry },
          { upsert: true },
        );
        count++;
        if (Date.now() - start > 10000) {
          start = Date.now();
          debug(`Parsed ${count} patents to add cids`);
        }
        entry.length = 0;
        currentPatentID = patentID;
      }
      entry.push(Number(compoundID));
    }
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'uspPatents',
        connection,
        stack: e.stack,
      });
    }
  }
}