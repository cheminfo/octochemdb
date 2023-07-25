import md5 from 'md5';

import debugLibrary from '../../../utils/Debug.js';
import getCollectionsLinks from '../utils/getCollectionsLinks.js';

import { main } from './main.js';
/**
 * @description Aggregate all synchronized collections into one collection of Bioactivities or/and Natural Products
 * @param {*} connection MongoDB connection
 * @return {Promise} Returns ActiveOrNaturals collection
 */
export async function aggregate(connection) {
  const collectionNames = [
    'lotuses',
    'npasses',
    'npAtlases',
    'cmaups',
    'coconuts',
    'bioassays',
  ];
  const debug = debugLibrary('aggregateActivesOrNaturals');
  try {
    const options = { collection: 'activesOrNaturals', connection };
    // Get progress,logs, target, lastDocument and links of the collection
    const progress = await connection.getProgress(options.collection);
    const targetCollection = await connection.getCollection(options.collection);

    let { links, collectionSources } = await getCollectionsLinks(
      connection,
      collectionNames,
    );
    const pubmedProgress = await connection.getProgress('pubmeds');
    collectionSources.push(pubmedProgress.sources);
    const sources = md5(collectionSources);
    const logs = await connection.getImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });

    if (sources !== progress.sources || progress.state !== 'aggregated') {
      // if lastDocumentImported is null or sources are different from the progress, start aggregation process
      const temporaryCollection = await connection.getCollection(
        `${options.collection}_tmp`,
      );

      // debug unique numbers of noStereoTautomerIDs
      debug.trace(
        `Unique numbers of noStereoTautomerIDs: ${Object.keys(links).length}`,
      );
      debug.info('start Aggregation process');
      // set progress to aggregating

      progress.state = 'aggregating';
      await connection.setProgress(progress);
      // parse all noStereoTautomerIDs and get their info
      await main(links);
      // rename temporary collection to activesOrNaturals
      await temporaryCollection.rename(options.collection, {
        dropTarget: true,
      });
      // set logs to aggregated
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'aggregated';
      await connection.updateImportationLog(logs);
      // set progress to aggregated
      progress.sources = sources;
      progress.dateEnd = Date.now();
      progress.state = 'aggregated';
      await connection.setProgress(progress);

      // Create Indexes
      await targetCollection.createIndex({ 'data.em': 1 });
      await targetCollection.createIndex({ 'data.mf': 1 });
      await targetCollection.createIndex({ 'data.kwBioassays': 1 });
      await targetCollection.createIndex({ 'data.meshTerms': 1 });
      await targetCollection.createIndex({ 'data.kwTaxonomies': 1 });
      await targetCollection.createIndex({ 'data.nbActivities': 1 });
      await targetCollection.createIndex({ 'data.pubmeds': 1 });
      await targetCollection.createIndex({ 'data.nbPubmeds': 1 });
      await targetCollection.createIndex({ 'data.patents': 1 });
      await targetCollection.createIndex({ 'data.nbPatents': 1 });
      await targetCollection.createIndex({ 'data.nbTaxonomies': 1 });
      await targetCollection.createIndex({ 'data.nbMassSpectra': 1 });
      await targetCollection.createIndex({ 'data.molecules': 1 });
      await targetCollection.createIndex({ 'data.nbMolecules': 1 });

      debug.info('Aggregation Done');
    } else {
      debug.info(`Aggregation already up to date`);
    }
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
