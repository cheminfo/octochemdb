import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import debugLibrary from '../../../utils/Debug.js';
import { shouldUpdate } from '../../../utils/shouldUpdate.js';

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
      destinationLocal: `../originalData//patents/`,
      collectionName: 'patents',
    };
    let sources;
    let titlesAndPatents;
    let titles2parse;
    let abstracts2parse;
    const progress = await connection.getProgress('patents');

    if (process.env.NODE_ENV === 'test') {
      titles2parse = [
        '../docker/src/plugins/patents/sync/utils/__tests__/data/pc_patent2title.ttl.gz',
      ];
      abstracts2parse = [
        '../docker/src/plugins/patents/sync/utils/__tests__/data/pc_patetn2abstract.ttl.gz',
      ];
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
        'https://ftp.ncbi.nlm.nih.gov/pubchem/RDF/patent/',
        `../originalData//patents/`,
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
    const lastDocumentImported = await getLastDocumentImported(
      connection,
      options.collectionName,
    );
    let isTimeToUpdate = await shouldUpdate(
      progress,
      sources,
      lastDocumentImported,
      process.env.PATENT_UPDATE_INTERVAL,
      connection,
    );

    if (isTimeToUpdate) {
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
      await temporaryCollection.rename(options.collectionName, {
        dropTarget: true,
      });
      const collection = await connection.getCollection(options.collectionName);
      await collection.createIndex(
        { 'data.title': 'text', 'data.abstract': 'text' },
        { weights: { 'data.title': 10, 'data.abstract': 1 } },
      );
      await collection.createIndex({ 'data.nbCompounds': 1 });

      // update Logs
      progress.sources = md5(JSON.stringify(sources));
      progress.state = 'updated';
      progress.dateEnd = Date.now();
      await connection.setProgress(progress);
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
