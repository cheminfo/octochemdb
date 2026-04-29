import md5 from 'md5';

import debugLibrary from '../../../utils/Debug.js';
import createIndexes from '../../../utils/createIndexes.js';
import getCollectionsLinks from '../utils/getCollectionsLinks.js';

import { main } from './main.js';
/**
 * Aggregate all synchronized collections into one collection of
 * Bioactivities and/or Natural Products.
 * @param {OctoChemConnection} connection - MongoDB connection wrapper
 * @returns {Promise<void>}
 */
export async function aggregate(connection) {
  const collectionNames = [
    'lotusesV2',
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

    const collectionsResult = await getCollectionsLinks(
      connection,
      collectionNames,
    );
    if (!collectionsResult) return;
    const { links, collectionSources } = collectionsResult;
    const pubmedProgress = await connection.getProgress('pubmeds');
    collectionSources.push(pubmedProgress.sources);
    const sources = md5(collectionSources.join(''));

    if (sources !== progress.sources || progress.state !== 'aggregated') {
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

      // set progress to aggregated
      progress.sources = sources;
      progress.dateEnd = Date.now();
      progress.state = 'aggregated';
      await connection.setProgress(progress);

      // Create Indexes
      await createIndexes(targetCollection, [
        { 'data.em': 1 },
        { 'data.mf': 1 },
        { 'data.kwBioassays': 1 },
        { 'data.kwTitles': 1 },
        { 'data.meshTerms': 1 },
        { 'data.kwTaxonomies': 1 },
        { 'data.nbActivities': 1 },
        { 'data.pubmeds': 1 },
        { 'data.nbPubmeds': 1 },
        { 'data.patents': 1 },
        { 'data.nbPatents': 1 },
        { 'data.nbTaxonomies': 1 },
        { 'data.nbMassSpectra': 1 },
        { 'data.molecules': 1 },
        { 'data.nbMolecules': 1 },
        { 'data.bioassaysPubChem': 1 },
      ]);
      debug.info('Aggregation Done');
    } else {
      debug.info(`Aggregation already up to date`);
    }
  } catch (/** @type {any} */ e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
