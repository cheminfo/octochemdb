import { parentPort } from 'worker_threads';

import OCL from 'openchemlib';

import debugLibrary from '../../../utils/Debug.js';
import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

const debug = debugLibrary('fixed');
const connection = new OctoChemConnection();
parentPort?.on('message', async (entryData) => {
  try {
    let { links, workerID } = entryData;

    let count = 0;
    const collection = await connection.getCollection('compounds');

    let start = Date.now();
    //let counter = 0;
    for (let seq = links[0]; seq <= links[1]; seq++) {
      const collectionEntry = await collection.find({ _seq: Number(seq) });
      let entry = await collectionEntry.next();
      if (Date.now() - start > 60000) {
        debug(
          `Worker ${workerID} fixed ${count} compounds, current seq: ${seq}`,
        );
        start = Date.now();
      }
      count++;

      if (entry?.data) {
        // check if it is already a JSON object
        let atoms = JSON.parse(JSON.stringify(entry?.data?.atoms));

        let index;
        if (
          entry?.data?.ocl?.index !== null &&
          entry?.data?.ocl?.index.length > 0
        ) {
          index = Array.from(
            new Int32Array(new Uint8Array(entry?.data?.ocl.index).buffer),
          );
          if (index === null) {
            index = entry?.data?.ocl.index;
          }
        } else {
          let molecule = OCL.Molecule.fromIDCode(entry?.data?.ocl?.idCode);
          index = molecule.getIndex();
        }
        // updateOne
        await collection.updateOne(
          { _id: entry._id },
          { $set: { 'data.atoms': atoms, 'data.ocl.index': index } },
        );
      } else {
        continue;
      }
    }

    parentPort.postMessage(`${workerID} fixed ${count} compounds`);
  } catch (e) {
    debug(e);
  }
});
