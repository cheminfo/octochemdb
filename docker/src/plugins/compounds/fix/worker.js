import { parentPort } from 'worker_threads';

import OCL from 'openchemlib';

import debugLibrary from '../../../utils/Debug.js';
import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

const debug = debugLibrary('fix');
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
      if (entry?.data) {
        // check if it is already a JSON object
        let atoms;
        if (typeof entry?.data?.atoms === 'object') {
          atoms = JSON.parse(entry?.data?.atoms);
        } else {
          atoms = entry?.data?.atoms;
        }
        let index;
        if (
          entry?.data?.ocl?.index !== null &&
          entry?.data?.ocl?.index.length > 0
        ) {
          index = Array.from(
            new Int32Array(new Uint8Array(entry?.data.index).buffer),
          );
          if (index === null) {
            index = entry?.data.index;
          }
        } else {
          let molecule = OCL.Molecule.fromMolfile(entry?.data?.molfile);
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
    if (Date.now() - start > 1000) {
      debug(`Worker ${workerID} fixed ${count} compounds`);
      start = Date.now();
    }
    count++;
    parentPort.postMessage(`${workerID} fixed ${count} compounds`);
  } catch (e) {
    debug(e);
  }
});
