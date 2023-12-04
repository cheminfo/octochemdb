/* eslint-disable no-console */
import { parentPort } from 'worker_threads';

import { getDatabase } from 'mass-fragmentation';
import md5 from 'md5';
import { MF } from 'mf-parser';
import OCL from 'openchemlib';

import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

//import { fragmentationDB } from './fragmentationDB.js';

const { Molecule } = OCL;
const connection = new OctoChemConnection();
let database = await getDatabase({ ionizationKind: ['esiPositive'] });
let md5Hash = md5(JSON.stringify(database));
parentPort?.on('message', async (dataEntry) => {
  let warnCount = 0;
  let warnDate = Date.now();
  try {
    const { links, workerID } = dataEntry;
    // get worker number
    const temporaryCollection = await connection.getCollection(
      `inSilicoFragments_tmp`,
    );
    const currentCollection =
      await connection.getCollection(`inSilicoFragments`);

    let count = 0;
    let start = Date.now();

    for (const link of links) {
      try {
        let molecule = Molecule.fromIDCode(link.idCode);
        let entry = await currentCollection.findOne({ _id: link.id });
        if (entry && entry?._id === link.id) {
          entry.data.fragmentationDbHash = md5Hash;
          const mfInfo = new MF(
            molecule.getMolecularFormula().formula,
          ).getInfo();

          const moleculeMf = mfInfo.mf;
          const moleculeEm = mfInfo.monoisotopicMass;
          entry.data.mf = moleculeMf;
          entry.data.em = moleculeEm;
          await temporaryCollection.updateOne(
            { _id: link.id },
            { $set: entry },
            { upsert: true },
          );
        }

        count++;
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          parentPort?.postMessage({
            workerID,
            currentCount: count,
            status: 'running',
          });
          start = Date.now();
        }
      } catch (e) {
        if (connection) {
          warnCount++;
          if (Date.now() - warnDate > Number(process.env.DEBUG_THROTTLING)) {
            console.log(
              `Warning(fragmentation) happened ${warnCount}:${e.message} `,
            );
          }
          warnDate = Date.now();
        }
      }
    }
    parentPort?.postMessage({ workerID, currentCount: count, status: 'done' });
  } catch (e) {
    if (connection) {
      console.log(e.message);
    }
  }
});
