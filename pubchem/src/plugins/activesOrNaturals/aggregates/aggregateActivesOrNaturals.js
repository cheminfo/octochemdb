import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import Debug from '../../../utils/Debug.js';
import getActivityKeywords from '../utils/getAcitivityKeywords.js';
import getActiveAgainstKeywords from '../utils/getActiveAgainstKeywords.js';
import getActivitiesInfo from '../utils/getActivitiesInfo.js';
import getCollectionsLinks from '../utils/getCollectionsLinks.js';
import getCompoundsInfo from '../utils/getCompoundsInfo.js';
import { getMeshTerms } from '../utils/getMeshTerms.js';
import getTaxonomyKeywords from '../utils/getTaxonomyKeywords.js';
import getTaxonomiesInfo from '../utils/utilsTaxonomies/getTaxonomiesInfo.js';

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
  const debug = Debug('aggregateActivesOrNaturals');
  const COLLECTION_NAME = 'activesOrNaturals';
  try {
    const options = { collection: COLLECTION_NAME, connection: connection };
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
    const lastDocumentImported = await getLastDocumentImported(
      options.connection,
      progress,
      options.collection,
    );
    // get compounds collection
    const compoundsCollection = await connection.getCollection('compounds');
    // get pubmeds collection
    const pubmedCollection = await connection.getCollection('pubmeds');

    // start aggregation process
    let counter = 0;
    let start = Date.now();
    if (
      lastDocumentImported === null ||
      sources !== progress.sources ||
      progress.state !== 'aggregated'
    ) {
      // if lastDocumentImported is null or sources are different from the progress, start aggregation process
      const temporaryCollection = await connection.getCollection(
        `${COLLECTION_NAME}_tmp`,
      );

      // debug unique numbers of noStereoIDs
      debug(`Unique numbers of noStereoIDs: ${Object.keys(links).length}`);
      debug('start Aggregation process');
      // set progress to aggregating
      progress.state = 'aggregatings';
      await connection.setProgress(progress);
      // parse all noStereoIDs and get their info
      for (const [noStereoID, sourcesLink] of Object.entries(links)) {
        let entry = { data: { naturalProduct: false } };
        // get all documents from all collections
        let data = [];
        for (const source of sourcesLink) {
          if (
            [
              'npasses',
              'cmaups',
              'coconuts',
              'lotuses',
              'npAtlases',
              'substances',
            ].includes(source.collection)
          ) {
            entry.data.naturalProduct = true;
          }
          const collection = await connection.getCollection(source.collection);
          let partialData = await collection.findOne({ _id: source.id });
          partialData.collection = source.collection;
          data.push(partialData);
        }

        // get unique taxonomies from all collections for the current noStereoID

        let taxons = await getTaxonomiesInfo(data, connection);

        // get unique activities from all collections for the current noStereoID

        let activityInfo = await getActivitiesInfo(data, connection);

        // get unique compound information from all collections for the current noStereoID

        entry = await getCompoundsInfo(
          entry,
          data,
          compoundsCollection,
          noStereoID,
          connection,
        );

        if (entry.data.cids) {
          // cids are from compunds collection
          const uniqueMeshTerms = {};
          const uniquePmIds = {};

          for (let i = 0; i < entry.data.cids.length; i++) {
            let cid = Number(entry.data.cids[i]);
            const { meshTermsForCid, pmIds } = await getMeshTerms(
              cid,
              pubmedCollection,
              connection,
            );

            meshTermsForCid.forEach((term) => {
              uniqueMeshTerms[term] = true;
            });
            pmIds.forEach((id) => {
              uniquePmIds[id] = true;
            });
          }

          let dbRefs = Object.keys(uniquePmIds).map((id) => ({
            $ref: 'pubmeds',
            $id: id,
          }));

          const meshTerms = Object.keys(uniqueMeshTerms);

          if (meshTerms.length > 0) {
            entry.data.kwMeshTerms = meshTerms;
          }
          if (dbRefs.length > 0) {
            entry.data.pubmeds = dbRefs;
          }
        }
        // if activityInfo is not empty, get unique keywords of activities and target taxonomies for the current noStereoID
        if (activityInfo.length > 0) {
          entry.data.bioActive = true;

          const keywordsActivities = getActivityKeywords(activityInfo);

          if (keywordsActivities.length > 0) {
            entry.data.kwBioassays = keywordsActivities;
          }

          const keywordsActiveAgainst = getActiveAgainstKeywords(activityInfo);

          if (keywordsActiveAgainst.length > 0) {
            entry.data.kwActiveAgainst = keywordsActiveAgainst;
          }
        }
        // if taxons is not empty, get unique keywords of taxonomies for the current noStereoID
        if (taxons.length > 0) {
          const keywordsTaxonomies = getTaxonomyKeywords(taxons);

          if (keywordsTaxonomies.length > 0) {
            entry.data.kwTaxonomies = keywordsTaxonomies;
          }
        }
        // if activityInfo is not empty, define entry.data.activities
        if (activityInfo.length > 0) {
          entry.data.activities = activityInfo;
        }
        // if taxons is not empty, define entry.data.taxonomies
        if (taxons.length > 0) {
          entry.data.taxonomies = taxons;
        }
        entry._seq = ++progress.seq;
        // update collection with new entry
        await temporaryCollection.updateOne(
          { _id: noStereoID },
          { $set: entry },
          { upsert: true },
        );

        if (
          Date.now() - start >
          Number(process.env.DEBUG_THROTTLING || 10000)
        ) {
          debug(`Processing: counter: ${counter} `);
          start = Date.now();
        }

        counter++;
      }
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
      await targetCollection.createIndex({ _seq: 1 });
      await targetCollection.createIndex({ _id: 1 });
      await targetCollection.createIndex({ 'data.em': 1 });
      await targetCollection.createIndex({ 'data.kwBioassays': 1 });
      await targetCollection.createIndex({ 'data.meshTerms': 1 });
      await targetCollection.createIndex({ 'data.kwTaxonomies': 1 });

      debug('Aggregation Done');
    } else {
      debug(`Aggregation already up to date`);
    }
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'activesOrNaturals', connection });
    }
  }
}
