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
      let sequenceNumber = Number(seq + 108896827);
      const collectionEntry = await collection.find({ _seq: sequenceNumber });
      let entry = await collectionEntry.next();
      if (Date.now() - start > 60000) {
        debug(
          `Worker ${workerID} fixed ${count} compounds, current seq: ${sequenceNumber}`,
        );
        start = Date.now();
      }
      count++;
      try {
        if (entry?.data) {
          // if atoms are already a JSON object, skip else if it is a string, parse it
          let atoms;
          if (typeof entry?.data?.atoms === 'string') {
            atoms = JSON.parse(entry?.data?.atoms);
          } else {
            atoms = JSON.parse(JSON.stringify(entry?.data?.atoms));
          }
          let index;
          if (
            entry?.data?.ocl?.index !== null &&
            entry?.data?.ocl?.index.length > 0 &&
            !(entry?.data?.ocl?.index instanceof Int32Array)
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
      } catch (e) {
        //debug(e);
        continue;
      }
    }

    parentPort.postMessage(`${workerID} fixed ${count} compounds`);
  } catch (e) {
    debug(e);
  }
});
