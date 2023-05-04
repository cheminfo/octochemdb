import { parentPort } from 'worker_threads';

import debugLibrary from '../../../utils/Debug.js';
import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

const connection = new OctoChemConnection();
const debug = debugLibrary('fixed');
parentPort?.on('message', async (entryData) => {
  try {
    let { links, workerID } = entryData;

    let count = 0;
    const collection = await connection.getCollection('substances');

    let start = Date.now();
    //let counter = 0;
    for (let seq = links[0]; seq <= links[1]; seq++) {
      const collectionEntry = await collection.find({ _seq: Number(seq) });
      let entry = await collectionEntry.next();
      if (Date.now() - start > 60000) {
        debug(`Worker ${workerID} fixed ${count} compounds`);
        start = Date.now();
      }
      count++;
      if (entry?.data?.atoms) {
        let atoms;
        if (typeof entry?.data?.atoms === 'string') {
          // check if it is already a JSON object
          atoms = JSON.parse(entry?.data?.atoms);
        } else {
          atoms = JSON.parse(JSON.stringify(entry?.data?.atoms));
        }
        // updateOne
        await collection.updateOne(
          { _id: entry._id },
          { $set: { 'data.atoms': atoms } },
        );
      } else {
        continue;
      }
    }
    if (Date.now() - start > 1000) {
      debug(`Worker ${workerID} fix ${count} substances`);
      start = Date.now();
    }
    parentPort.postMessage(`${workerID} fix ${count} substances`);
  } catch (e) {
    debug(e);
  }
});
