import { parentPort } from 'worker_threads';

import { reactionFragmentation, getDatabase } from 'mass-fragmentation';
import md5 from 'md5';
import { MF } from 'mf-parser';
import OCL from 'openchemlib';

import debugLibrary from '../../../utils/Debug.js';
import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';
import { getMasses } from '../utils/getMasses.js';

const { Molecule } = OCL;
const connection = new OctoChemConnection();
const debug = debugLibrary('WorkerProcess');
let databases = {
  esi: {
    positive: md5(
      JSON.stringify(getDatabase({ ionizationKind: ['esiPositive'] })),
    ),

    negative: md5(
      JSON.stringify(getDatabase({ ionizationKind: ['esiNegative'] })),
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

        if (molecule.getAtoms() <= 100) {
          let result = {
            data: {
              ocl: { idCode: link.idCode },
              spectrum: {
                data: {},
              },
            },
          };
          const mfInfo = new MF(
            molecule.getMolecularFormula().formula,
          ).getInfo();

          result.data.mf = mfInfo.mf;
          result.data.em = mfInfo.monoisotopicMass;
          const fragmentationOptions = {
            maxDepth: 3,
            limitReactions: 500,
            minIonizations: 1,
            maxIonizations: 1,
            minReactions: 0,
            maxReactions: 2,
          };
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
                if (ionSource !== 'esi') {
                  continue;
                }
                debug.trace('Fragmenting');
                let ionizationKind =
                  ionMode === 'positive' && ionSource === 'esi'
                    ? 'esiPositive'
                    : 'esiNegative';
                fragmentationOptions.ionizationKind = [ionizationKind];
                let fragments = reactionFragmentation(
                  molecule,
                  // @ts-ignore
                  fragmentationOptions,
                );
                const massesArray = getMasses(fragments.masses);

                if (massesArray.length > 0) {
                  result.data.spectrum.data.x = massesArray;
                  result.data.fragmentationDbHash =
                    databases[ionSource][ionMode];

                  result._id = {
                    noStereoTautomerID: link.id,
                    ionMode,
                    ionSource,
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
