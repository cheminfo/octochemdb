import md5 from 'md5';

import getLastFileSync from '../../../sync/http/utils/getLastFileSync.js';
import debugLibrary from '../../../utils/Debug.js';

import { getFilesToImportForUsp } from './utils/getFilesToImportForUsp.js';
import { syncAllUspFolders } from './utils/http/syncAllUspFolders.js';
import { importUspFiles } from './utils/importUspFiles.js';
import ungzipGrepAndSort from './utils/ungzipGrepAndSort.js';
/**
 * @description performs the importation of usp patents
 * @param {*} connection - mongo connection
 * @returns {Promise} usp collection
 */
export async function sync(connection) {
  const debug = debugLibrary('syncUsp');
  try {
    // get progress
    const progress = await connection.getProgress('uspPatents');
    let allFiles;
    let lastFile;
    let options = {
      collectionSource: process.env.CIDTOPATENT_SOURCE,
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/uspPatents/cidToPatents`,
      collectionName: 'uspPatents',
      filenameNew: 'cidToPatents',
      extensionNew: 'gz',
    };
    // get all files to import
    if (process.env.NODE_ENV === 'test') {
      allFiles = [
        {
          name: '2001.xml',
          path: `${process.env.USP_TEST_SOURCE}2001.xml`,
        },
        {
          name: '2005.xml',
          path: `${process.env.USP_TEST_SOURCE}2005.xml`,
        },
        {
          name: '2006.xml',
          path: `${process.env.USP_TEST_SOURCE}2006.xml`,
        },
        {
          name: '2007.xml',
          path: `${process.env.USP_TEST_SOURCE}2007.xml`,
        },
        {
          name: '2023.xml',
          path: `${process.env.USP_TEST_SOURCE}2023.xml`,
        },
      ];
      lastFile = process.env.CIDTOPATENT_SOURCE_TEST;
      // remember to add cidToPatents test file
    } else if (
      Date.now() - Number(progress.dateEnd) >
      Number(process.env.PATENT_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000
    ) {
      lastFile = await getLastFileSync(options);
      allFiles = await syncAllUspFolders(connection);
    }

    const { files, lastDocument } = await getFilesToImportForUsp(
      connection,
      progress,
      allFiles,
    );
    // put file.path in array
    let sources = [];
    files.forEach((file) => {
      sources.push(file.path.replace(`${process.env.ORIGINAL_DATA_PATH}`, ''));
    });

    let shouldUpdate = false;
    if (
      progress.dateEnd !== 0 &&
      Date.now() - Number(progress.dateEnd) >
        Number(process.env.USP_PATENTS_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      md5(JSON.stringify(sources)) !== progress.sources
    ) {
      progress.dateStart = Date.now();
      shouldUpdate = true;
      await connection.setProgress(progress);
    }
    const logs = await connection.getImportationLog({
      collectionName: 'uspPatents',
      sources,
      startSequenceID: progress.seq,
    });
    if (
      (JSON.stringify(sources) !== progress.sources && shouldUpdate) ||
      progress.state !== 'updated'
    ) {
      //set progress to updating
      progress.state = 'updating';
      const sortedFile = `${lastFile.split('.gz')[0]}.sorted`;
      await ungzipGrepAndSort(lastFile, sortedFile);
      debug('ungzip and sort done');
      await connection.setProgress(progress);
      await importUspFiles(connection, progress, files, sortedFile, {
        lastDocument,
      });
      // set progress to updated
      progress.state = 'updated';
      await connection.setProgress(progress);
      // create indexes
      const collection = await connection.getCollection('uspPatents');
      await collection.createIndex({ 'data.title': 1 });
      await collection.createIndex({ 'data.patentNumber': 1 });
      await collection.createIndex({ 'data.cids': 1 });
      // create text index where title has more weight than abstract
      await collection.createIndex(
        { 'data.title': 'text', 'data.abstract': 'text' },
        { weights: { 'data.title': 10, 'data.abstract': 1 } },
      );
      await collection.createIndex({ _seq: 1 });
      progress.sources = md5(JSON.stringify(sources));
      progress.state = 'updated';
      progress.dateEnd = Date.now();
      await connection.setProgress(progress);

      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';

      await connection.updateImportationLog(logs);
    }
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'uspPatents',
        connection,
        stack: e.stack,
      });
    }
  }
}
