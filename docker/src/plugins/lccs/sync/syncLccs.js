import pkg from 'fs-extra';
import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import gunzipStream from '../../../utils/gunzipStream.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

import { getGHS } from './utils/getGHS.js';
import { parseLccs } from './utils/parseLccs.js';

const { existsSync, rmSync } = pkg;
/**
 * @description syncLccs - synchronize lccs collection from lccs database
 * @param {*} connection - mongo connection
 * @returns {Promise} returns collection lccs
 */
export async function sync(connection) {
  const debug = debugLibrary('syncLccs');
  let options = {
    collectionSource:
      'https://ftp.ncbi.nlm.nih.gov/pubchem/Compound/Extras/CID-LCSS.xml.gz',
    destinationLocal: `../originalData/lccs/full`,
    collectionName: 'lccs',
    filenameNew: 'lccs',
    extensionNew: 'gz',
  };
  try {
    let sources;
    let lastFile;
    if (process.env.NODE_ENV === 'test') {
      lastFile = `../docker/src/plugins/lccs/sync/utils/__tests__/data/test2.xml.gz`;
      sources = [lastFile];
    } else {
      // get last file from lccs
      lastFile = await getLastFileSync(options);
      sources = [lastFile.replace(`../originalData/`, '')];
    }
    // get sources, progress and lccs collection
    const progress = await connection.getProgress('lccs');

    // get last document imported
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.LCCS_UPDATE_INTERVAL,
      connection,
    );
    // define counter
    let counter = 0;
    let imported = 0;
    let start = Date.now();
    if (isTimeToUpdate) {
      const collection = await connection.getCollection('lccs');

      // create temporary collection
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      debug.info(`Start importing lccs`);
      // set progress state to updating
      progress.state = 'updating';
      await connection.setProgress(progress);
      let fileGHS;
      if (process.env.NODE_ENV === 'test') {
        fileGHS =
          '../docker/src/plugins/lccs/sync/utils/__tests__/data/ghs.txt';
      } else {
        options.collectionSource =
          'https://pubchem.ncbi.nlm.nih.gov/ghs/ghscode_10.txt';
        options.extensionNew = 'txt';
        options.filenameNew = 'ghscode';
        fileGHS = await getLastFileSync(options);
      }

      const outputFilename = await gunzipStream(
        lastFile,
        lastFile.replace('.gz', '.xml'),
      );

      const { hCodes, pCodes } = await getGHS(fileGHS);
      for await (let entry of parseLccs(outputFilename, { hCodes, pCodes })) {
        counter++;
        if (process.env.NODE_ENV === 'test' && counter > 20) break;

        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          debug.trace(
            `Processing: counter: ${counter} - imported: ${imported}`,
          );
          start = Date.now();
        }

        entry._seq = ++progress.seq;

        await temporaryCollection.updateOne(
          { _id: entry._id },
          { $set: entry },
          { upsert: true },
        );
        imported++;
      }
      // Temporary collection replace old collection
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });

      //Update progress in admin collection
      progress.sources = md5(JSON.stringify(sources));
      progress.dateEnd = Date.now();
      progress.state = 'updated';
      await connection.setProgress(progress);
      // Indexing of collection properties
      await createIndexes(collection, [
        { 'data.description': 1 },
        { 'data.pictograms': 1 },
        { 'data.hCodesDescription': 1 },
        { 'data.pCodesDescription': 1 },
        { 'data.signals': 1 },
        { 'data.physicalProperties': 1 },
        { 'data.toxicalInformation': 1 },
        { 'data.exposureLimits': 1 },
        { 'data.healthAndSymptoms': 1 },
        { 'data.firstAid': 1 },
        { 'data.flammabilityAndExplosivity': 1 },
        { 'data.stabilityAndReactivity': 1 },
        { 'data.storageAndHandling': 1 },
        { 'data.cleanUpAndDisposal': 1 },
        { _seq: 1 },
      ]);
      if (existsSync(outputFilename)) {
        rmSync(outputFilename);
      }
      debug.info(`Lccs importation done`);
    } else {
      debug.info(`file already processed`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'lccs',
        connection,
        stack: e.stack,
      });
    }
  }
}
