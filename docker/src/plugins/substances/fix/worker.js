import { parentPort } from 'worker_threads';

import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

const connection = new OctoChemConnection();
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
      if (entry?.data) {
        let atoms = JSON.parse(entry?.data?.atoms);

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
      console.log(`Worker ${workerID} fix ${count} substances`);
      start = Date.now();
    }
    count++;
    parentPort.postMessage(`${workerID} fix ${count} substances`);
  } catch (e) {
    console.log(e);
  }
});
