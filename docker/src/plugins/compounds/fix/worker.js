import { parentPort } from 'worker_threads';

import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

const connection = new OctoChemConnection();
parentPort?.on('message', async (entryData) => {
  try {
    let { links, workerID } = entryData;

    let count = 0;
    const collection = await connection.getCollection('compounds');

    let start = Date.now();
    //let counter = 0;
    for (let link of links) {
      const collectionEntry = await collection.find({ _id: Number(link._id) });
      let entry = await collectionEntry.next();
      if (entry?.data) {
        let atoms = JSON.parse(entry?.data?.atoms);
        let index = Array.from(
          new Int32Array(new Uint8Array(entry?.data.index).buffer),
        );
        // updateOne
        await collection.updateOne(
          { _id: entry._id },
          { $set: { 'data.atoms': atoms, 'data.ocl.index': index } },
        );
      } else {
        continue;
      }
    }
    if (Date.now() - start > 1000) {
      console.log(`Worker ${workerID} fixed ${count} compounds`);
      start = Date.now();
    }
    count++;
    parentPort.postMessage(`${workerID} fixed ${count} compounds`);
  } catch (e) {
    console.log(e);
  }
});
