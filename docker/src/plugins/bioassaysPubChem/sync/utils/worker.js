import { parentPort } from 'worker_threads';

import debugLibrary from '../../../../utils/Debug.js';
import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';

const connection = new OctoChemConnection();
const debug = debugLibrary('WorkerProcess');
parentPort?.on('message', async (dataEntry) => {
  let warnCount = 0;
  let warnDate = Date.now();
  try {
    const { fileList, workerID } = dataEntry;
    debug.trace(`Worker ${workerID} started`);
    // get worker number
    const temporaryCollection =
      await connection.getCollection(`bioassaysPubChem_tmp`);
    let count = 0;
    let start = Date.now();

    for (const file of fileList) {
      try {
        let result = {
          _id: link.id,
          data: {},
        };

        await temporaryCollection.updateOne(
          { _id: link.id },
          { $set: result },
          { upsert: true },
        );

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
                collection: 'bioassaysPubChem',
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
        collection: 'bioassaysPubChem',
        connection,
        stack: e.stack,
      });
    }
  }
});
