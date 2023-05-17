import { parentPort } from 'worker_threads';

import debug from 'debug';

import { OctoChemConnection } from '../../utils/OctoChemConnection';

const connection = new OctoChemConnection();
parentPort?.on('message', async (entryData) => {
  try {
    let { links, workerID } = entryData;

    let count = 0;
    const collection = await connection.getCollection('pubmeds');

    let start = Date.now();
    for (let seq = links[0]; seq <= links[1]; seq++) {
      const collectionEntry = await collection.find({ _seq: Number(seq) });
      let entry = await collectionEntry.next();
      if (Date.now() - start > 60000) {
        // @ts-ignore
        parentPort.postMessage({
          workerID,
          currentCount: count,
          status: 'running',
        });
        start = Date.now();
      }
      count++;

      if (entry?.data?.compounds) {
        // check if data.compounds is an array of objects or an array of numbers
        if (typeof entry.data.compounds[0] === 'number') {
          let compounds = entry.data.compounds;
          let dbRefs = [];
          for (let compound of compounds) {
            dbRefs.push({ $ref: 'compounds', $id: compound });
          }
          delete entry.data.compounds;
          entry.data.compounds = dbRefs;
        }
        await collection.updateOne(
          { _id: entry._id },
          { $set: { data: entry.data } },
        );
      } else {
        continue;
      }
    }

    // @ts-ignore
    parentPort.postMessage({ workerID, currentCount: count, status: 'done' });
  } catch (e) {
    debug(e);
  }
});
