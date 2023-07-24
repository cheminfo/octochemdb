import { parentPort } from 'worker_threads';

import { reactionFragmentation } from 'mass-fragmentation';
import OCL from 'openchemlib';

import debugLibrary from '../../../utils/Debug.js';
import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

const { Molecule } = OCL;
const connection = new OctoChemConnection();
const debug = debugLibrary('WorkerProcess');
parentPort?.on('message', async (dataEntry) => {
  try {
    const fragmentationOptions = {
      database: 'cid',
      mode: 'positive',
      maxDepth: 3,
    };
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
        let fragments;
        try {
          fragments = reactionFragmentation(molecule, fragmentationOptions);
        } catch (e) {
          console.log(e);
          console.log(reactionFragmentation(molecule, fragmentationOptions));
        }

        if (!fragments) {
          continue;
        }
        result.data.trees = { positive: fragments.products };
        result.data.masses = { positive: fragments.masses };

        if (link) {
          await temporaryCollection.updateOne(
            { _id: link.id },
            { $set: result },
            { upsert: true },
          );
          count++;
          if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
            parentPort?.postMessage({
              workerID,
              currentCount: count,
              status: 'running',
            });
            start = Date.now();
          }
        }
      } catch (e) {
        if (connection) {
          await debug.warn(`Warning(fragmentation):${e.message}`, {
            collection: 'inSilicoFragments',
            connection,
            stack: e.stack,
          });
        }
        continue;
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
