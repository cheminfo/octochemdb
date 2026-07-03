import { parentPort } from 'node:worker_threads';

import { getDatabase, reactionFragmentation } from 'mass-fragmentation';
import md5 from 'md5';
import { MF } from 'mf-parser';
import OCL from 'openchemlib';

import debugLibrary from '../../../utils/Debug.js';
import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';
import { getMasses } from '../utils/getMasses.js';

import { fragmentationOptions } from './fragmentationOptions.js';

const { Molecule } = OCL;
const connection = new OctoChemConnection();
const debug = debugLibrary('WorkerProcess');
let databases = {
  esi: {
    positive: md5(
      JSON.stringify(
        getDatabase({ ionizations: ['esi'], modes: ['positive'] }),
      ),
    ),

    negative: md5(
      JSON.stringify(
        getDatabase({ ionizations: ['esi'], modes: ['negative'] }),
      ),
    ),
  },
};
parentPort?.on('message', async (dataEntry) => {
  let warnCount = 0;
  let warnDate = Date.now();
  try {
    const { links, workerID } = dataEntry;
    debug.trace(`Worker ${workerID} started`);
    // get worker number

    const currentCollection =
      await connection.getCollection(`inSilicoFragments`);

    let count = 0;
    let start = Date.now();

    for (const link of links) {
      // now in each link has an array of idCodes
      try {
        for (const idCodeObj of link) {
          let molecule = Molecule.fromIDCode(idCodeObj.noStereoId);
          const mfInfo = new MF(
            molecule.getMolecularFormula().formula,
          ).getInfo();

          if (mfInfo.monoisotopicMass <= 1000) {
            let result = {
              data: {
                ocl: {
                  noStereoId: idCodeObj.noStereoId,
                  noStereoTautomerID: idCodeObj.noStereoTautomerID,
                },
                spectrum: {
                  data: {},
                },
              },
            };
            result.data.mf = mfInfo.mf;
            result.data.em = mfInfo.monoisotopicMass;

            if (process.env.NODE_ENV === 'test') {
              fragmentationOptions.limitReactions = 10;
            }
            let ionSources = ['esi'];
            let mode = ['positive', 'negative'];
            for (const ionSource of ionSources) {
              for (const ionMode of mode) {
                // Query by the actual stored shape: documents are written with
                // these values nested inside `_id` (see the upsert below), with
                // different key names (mode/ionization). Querying top-level
                // noStereoId/ionMode/ionSource never matched, so this findOne
                // always returned null — defeating the dedup (every molecule
                // re-fragmented every run) and forcing a full collection scan.
                let entry = await currentCollection.findOne({
                  _id: {
                    noStereoId: idCodeObj.noStereoId,
                    mode: ionMode,
                    ionization: ionSource,
                  },
                });

                if (
                  !entry ||
                  entry.data.fragmentationDbHash !==
                    databases[ionSource][ionMode]
                ) {
                  fragmentationOptions.ionizations = [ionSource];
                  fragmentationOptions.modes = [ionMode];

                  let fragments = reactionFragmentation(
                    molecule,
                    fragmentationOptions,
                  );
                  const massesArray = getMasses(fragments.masses);

                  if (massesArray.length > 0) {
                    result.data.spectrum.data.x = massesArray;
                    result.data.fragmentationDbHash =
                      databases[ionSource][ionMode];

                    result._id = {
                      noStereoId: idCodeObj.noStereoId,
                      mode: ionMode,
                      ionization: ionSource,
                    };
                    await currentCollection.updateOne(
                      { _id: result._id },
                      { $set: result },
                      { upsert: true },
                    );
                  }
                }
              }
            }
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
      } catch (error) {
        if (connection) {
          warnCount++;
          if (Date.now() - warnDate > Number(process.env.DEBUG_THROTTLING)) {
            await debug.warn(
              `Warning(fragmentation) happened ${warnCount}:${error.message} `,
              {
                collection: 'inSilicoFragments',
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
        collection: 'inSilicoFragments',
        connection,
        stack: error.stack,
      });
    }
  }
});
