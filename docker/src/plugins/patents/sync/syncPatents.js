import md5 from 'md5';

import debugLibrary from '../../../utils/Debug.js';

import getTitlesAndAbstracts from './utils/https/getTitlesAndAbstract.js';
import insertAbstract from './utils/insertAbstract.js';
import insertTitle from './utils/insertTitle.js';

/**
 * @description sync patents from PubChem database
 * @param {*} connection - mongo connection
 * @returns {Promise} returns patents collection
 */
export async function sync(connection) {
  const debug = debugLibrary('syncPatents');
  try {
    let options = {
      destinationLocal: `${process.env.ORIGINAL_DATA_PATH}/patents/`,
      collectionName: 'patents',
    };
    let sources;
    let titlesAndPatents;
    let titles2parse;
    let abstracts2parse;
    const progress = await connection.getProgress('patents');

    if (process.env.NODE_ENV === 'test') {
      titles2parse = [process.env.PATENTS_TITLES_TEST];
      abstracts2parse = [process.env.PATENTS_ABSTRACTS_TEST];
      sources = [];
      titles2parse.forEach((title) => {
        sources.push(title);
      });
      abstracts2parse.forEach((abstract) => {
        sources.push(abstract);
      });
    } else if (
      Date.now() - Number(progress.dateEnd) >
      Number(process.env.PATENT_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000
    ) {
      titlesAndPatents = await getTitlesAndAbstracts(
        process.env.PATENTS_TITLES_ABSTRACT_SOURCE,
        `${process.env.ORIGINAL_DATA_PATH}/patents/`,
      );
      titles2parse = titlesAndPatents?.titlesDownloaded;
      abstracts2parse = titlesAndPatents?.abstractsDownloaded;

      sources = [];
      titles2parse?.forEach((title) => {
        sources.push(title);
      });
      abstracts2parse?.forEach((abstract) => {
        sources.push(abstract);
      });
    } else {
      sources = progress.sources; // this will prevent to update the collection
    }

    let shouldUpdate = false;
    if (
      progress.dateEnd !== 0 &&
      Date.now() - Number(progress.dateEnd) >
        Number(process.env.PATENT_UPDATE_INTERVAL) * 24 * 60 * 60 * 1000 &&
      md5(JSON.stringify(sources)) !== progress.sources
    ) {
      progress.dateStart = Date.now();
      shouldUpdate = true;
      await connection.setProgress(progress);
    }
    const logs = await connection.getImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    if (
      (JSON.stringify(sources) !== progress.sources && shouldUpdate) ||
      progress.state !== 'updated'
    ) {
      progress.state = 'updating';
      await connection.setProgress(progress);

      if (titles2parse && abstracts2parse) {
        for (let title of titles2parse) {
          await insertTitle(title, connection);
        }
        for (let abstract of abstracts2parse) {
          await insertAbstract(abstract, connection);
        }
      }
      const temporaryCollection = await connection.getCollection(
        `${options.collectionName}_tmp`,
      );
      temporaryCollection.rename(options.collectionName, { dropTarget: true });
      const collection = await connection.getCollection(options.collectionName);
      await collection.createIndex(
        { 'data.title': 'text', 'data.abstract': 'text' },
        { weights: { 'data.title': 10, 'data.abstract': 1 } },
      );
      await collection.createIndex({ 'data.nbCompounds': 1 });

      // update Logs in importationLogs collection
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
      await debug.fatal(e.message, {
        collection: 'patents',
        connection,
        stack: e.stack,
      });
    }
  }
}
