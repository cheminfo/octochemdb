import { parentPort } from 'worker_threads';

import { reactionFragmentation } from 'mass-fragmentation';
import OCL from 'openchemlib';

import debugLibrary from '../../../utils/Debug.js';
import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

//import { fragmentationDB } from './fragmentationDB.js';

const { Molecule } = OCL;
const connection = new OctoChemConnection();
const debug = debugLibrary('WorkerProcess');

parentPort?.on('message', async (dataEntry) => {
  let warnCount = 0;
  let warnDate = Date.now();
  try {
    const { links, workerID } = dataEntry;
    debug.trace(`Worker ${workerID} started`);
    // get worker number
    const temporaryCollection = await connection.getCollection(
      `inSilicoFragments_tmp`,
    );
    let count = 0;
    let start = Date.now();

    for (const link of links) {
      try {
        let result = {
          _id: link.id,
          data: {
            ocl: { idCode: link.idCode },
          },
        };

        let molecule = Molecule.fromIDCode(link.idCode);
        if (molecule.getAtoms() <= 200) {
          const fragmentationOptions = {
            ionizationKind: ['esiPositive'],
            maxDepth: 3,
            limitReactions: 500,
            minIonizations: 1,
            maxIonizations: 1,
            minReactions: 0,
            maxReactions: 2,
          };

          // @ts-ignore
          debug.trace(`Fragmenting ${molecule.toSmiles()}`);
          let fragments = reactionFragmentation(molecule, fragmentationOptions);
          const massesArray = getMasses(fragments.masses);
          if (massesArray?.length > 0) {
            result.data.masses = { positive: massesArray };
            await temporaryCollection.updateOne(
              { _id: link.id },
              { $set: result },
              { upsert: true },
            );
          }
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
            await debug.warn(
              `Warning(fragmentation) happened ${warnCount}:${e.message} `,
              {
                collection: 'inSilicoFragments',
                connection,
                stack: e.stack,
              },
            );
          }
          warnDate = Date.now();
        }
      }
    }
    parentPort?.postMessage({ workerID, currentCount: count, status: 'done' });
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'inSilicoFragments',
        connection,
        stack: e.stack,
      });
    }
  }
});

function getMasses(masses) {
  let result = {};
  for (let i = 0; i < masses.length; i++) {
    if (masses[i]?.mz) {
      result[masses[i].mz] = true;
    }
  }
  return Object.keys(result).map(Number);
}
