import { readFileSync } from 'node:fs';
import { parentPort } from 'node:worker_threads';
import { gunzipSync } from 'node:zlib';

import debugLibrary from '../../../../utils/Debug.js';
import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';

import { parseBioassaysPubChem } from './parseBioassaysPubChem.js';

const debug = debugLibrary('WorkerProcess');

parentPort?.on('message', async (dataEntry) => {
  const connection = new OctoChemConnection();

  let warnCount = 0;
  let warnDate = Date.now();
  try {
    const { fileList, workerID } = dataEntry;
    debug.trace(`Worker ${workerID} started`);
    const temporaryCollection =
      await connection.getCollection(`bioassaysPubChem_tmp`);
    let count = 0;
    let start = Date.now();
    for (const file of fileList) {
      try {
        const raw = readFileSync(file);
        // PubChem ships every assay as a gzipped JSON inside the per-range zip.
        const jsonString = file.endsWith('.gz')
          ? gunzipSync(raw).toString('utf8')
          : raw.toString('utf8');
        const json = JSON.parse(jsonString);

        const entry = await parseBioassaysPubChem(json, connection);

        // Downstream aggregation joins assays to compounds via associatedCIDs;
        // skip entries we could not resolve to keep the collection useful.
        if (!entry?.data?.associatedCIDs?.length) {
          continue;
        }

        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
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
      } catch (error) {
        if (connection) {
          warnCount++;
          if (Date.now() - warnDate > Number(process.env.DEBUG_THROTTLING)) {
            await debug.warn(
              `Warning(fragmentation) happened ${warnCount}:${error.message} `,
              {
                collection: 'bioassaysPubChem',
                connection,
                stack: error.stack,
              },
            );
          }
          warnDate = Date.now();
        }
      }
    }

    parentPort?.postMessage({ workerID, currentCount: count, status: 'done' });
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'bioassaysPubChem',
        connection,
        stack: error.stack,
      });
    }
  }
});
