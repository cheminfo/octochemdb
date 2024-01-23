import { parentPort } from 'worker_threads';

import { reactionFragmentation, getDatabase } from 'mass-fragmentation';
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
      try {
        let molecule = Molecule.fromIDCode(link.idCode);
        const mfInfo = new MF(molecule.getMolecularFormula().formula).getInfo();

        if (mfInfo.monoisotopicMass <= 1000) {
          let result = {
            data: {
              ocl: { idCode: link.idCode },
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
              let entry = await currentCollection.findOne({
                noStereoTautomerID: link.id,
                ionMode,
                ionSource,
              });

              if (
                entry === undefined ||
                entry?.data.fragmentationDbHash !==
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
                    noStereoTautomerID: link.id,
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
