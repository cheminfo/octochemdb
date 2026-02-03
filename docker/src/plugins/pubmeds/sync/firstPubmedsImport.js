/* eslint-disable camelcase */

import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';

import { getCidFromPmid } from './utils/getCidFromPmid.js';
import { getFilesToImport } from './utils/getFilesToImport.js';
import { importPubmedFiles } from './utils/importPubmedFiles.js';
import { syncPubmedFolder } from './utils/syncPubmedFolder.js';

/**
 * @description performs the first import of pubmeds
 * @param {*} connection - mongo connection
 * @returns {Promise} pubmeds collection
 */
async function firstPubmedImport(connection) {
  const debug = debugLibrary('firstPubmedImport');
  try {
    // get progress
    const progress = await connection.getProgress('pubmeds');
    if (progress.state === 'updated') {
      debug.info('First importation has been completed. Should only update.');
      return;
    } else {
      debug.info(`Continuing first importation from ${progress.seq}.`);
    }
    let allFiles;
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: 'firstImportTest.xml.gz',
          path: `../docker/src/plugins/pubmeds/sync/utils/__tests__/data/firstImportTest.xml.gz`,
        },
      ];
    } else {
      // get all files to import
      allFiles = await syncPubmedFolder(connection, 'first');
    }
    const { files, lastDocument } = await getFilesToImport(
      connection,
      progress,
      allFiles,
      'first',
    );
    //set progress to updating
    progress.state = 'updating';
    await connection.setProgress(progress);
    // get cidToPmid map
    let options = {
      collectionSource:
        'https://ftp.ncbi.nlm.nih.gov/pubchem/Compound/Extras/CID-PMID.gz',
      destinationLocal: `../originalData//pubmeds/cidToPmid`,
      collectionName: 'pubmeds',
      filenameNew: 'cidToPmid',
      extensionNew: 'gz',
    };
    let cidToPmidPath;
    if (process.env.NODE_ENV === 'test') {
      cidToPmidPath = `../docker/src/plugins/pubmeds/sync/utils/__tests__/data/cidToPmidTest.gz`;
    } else {
      cidToPmidPath = await getLastFileSync(options);
    }
    const pmidToCid = await getCidFromPmid(cidToPmidPath, connection);
    await importPubmedFiles(
      connection,
      progress,
      files,
      { lastDocument },
      pmidToCid,
      'first',
    );
    // set progress to updated
    progress.state = 'updated';
    progress.dateEnd = Date.now();
    await connection.setProgress(progress);
    // create indexes
    const collection = await connection.getCollection('pubmeds');

    await createIndexes(collection, [
      { 'data.meshHeadings': 1 },
      { 'data.compounds': 1 },
      { _seq: 1 },
    ]);
    // create text index where title and meshHeading have more weight than abstract
    await collection.createIndex(
      {
        'data.article.title': 'text',
        'data.meshHeadings': 'text',
        'data.article.abstract': 'text',
      },
      { language_override: 'languageTextSearch' },
      {
        weights: {
          'data.article.title': 10,
          'data.meshHeadings': 10,
          'data.article.abstract': 1,
        },
      },
    );
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'pubmeds',
        connection,
        stack: e.stack,
      });
    }
  }
}

export default firstPubmedImport;
