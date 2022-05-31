import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import Debug from '../../../utils/Debug.js';
import getActivityKeywords from '../utils/getAcitivityKeywords.js';
import getActiveAgainstKeywords from '../utils/getActiveAgainstKeywords.js';
import getActivitiesInfo from '../utils/getActivitiesInfo.js';
import getCollectionsLinks from '../utils/getCollectionsLinks.js';
import getCompoundsInfo from '../utils/getCompoundsInfo.js';
import getTaxonomyKeywords from '../utils/getTaxonomyKeywords.js';
import getTaxonomiesInfo from '../utils/utilsTaxonomies/getTaxonomiesInfo.js';

const collectionNames = [
  'lotuses',
  'npasses',
  'npAtlases',
  'cmaups',
  'coconuts',
  'substances',
  'bioassays',
];

const debug = Debug('aggregateDBs');

const COLLECTION_NAME = 'activesOrNaturals';

export async function aggregate(connection) {
  try {
    const options = { collection: COLLECTION_NAME, connection: connection };
    const progress = await connection.getProgress(options.collection);

    const targetCollection = await connection.getCollection(options.collection);
    const compoundsCollection = await connection.getCollection('compounds');
    let { links, collectionSources } = await getCollectionsLinks(
      connection,
      collectionNames,
    );
    const sources = md5(collectionSources);
    const logs = await connection.geImportationLog({
      collectionName: options.collectionName,
      sources,
      startSequenceID: progress.seq,
    });
    const lastDocumentImported = await getLastDocumentImported(
      options.connection,
      progress,
      options.collection,
    );

    let counter = 0;
    let start = Date.now();

    if (
      lastDocumentImported === null ||
      sources !== progress.sources ||
      progress.state !== 'updated'
    ) {
      const temporaryCollection = await connection.getCollection(
        `${COLLECTION_NAME}_tmp`,
      );
      debug(`Unique numbers of noStereoIDs: ${Object.keys(links).length}`);
      debug('start Aggregation process');
      progress.state = 'aggregating';
      await connection.setProgress(progress);
      for (const [noStereoID, sourcesLink] of Object.entries(links)) {
        let entry = { data: { naturalProduct: false } };
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

        let taxons = await getTaxonomiesInfo(data, connection);

        let activityInfo = await getActivitiesInfo(data, connection);

        entry = await getCompoundsInfo(
          entry,
          data,
          compoundsCollection,
          noStereoID,
          connection,
        );

        if (activityInfo.length > 0) {
          entry.data.BioActive = true;

          const keywordsActivities = getActivityKeywords(activityInfo);
          if (keywordsActivities.length > 0) {
            entry.data.kwBioassays = keywordsActivities;
          }
          const keywordsActiveAgainst = getActiveAgainstKeywords(activityInfo);
          if (keywordsActiveAgainst.length > 0) {
            entry.data.kwActiveAgainst = keywordsActiveAgainst;
          }
        }
        if (taxons.length > 0) {
          const keywordsTaxonomies = getTaxonomyKeywords(taxons);

          if (keywordsTaxonomies.length > 0) {
            entry.data.kwTaxonomies = keywordsTaxonomies;
          }
        }
        if (activityInfo.length > 0) {
          entry.data.activities = activityInfo;
        }

        if (taxons.length > 0) {
          entry.data.taxonomies = taxons;
        }

        entry._seq = ++progress.seq;

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
      await temporaryCollection.rename(options.collection, {
        dropTarget: true,
      });
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'aggregated';
      await connection.updateImportationLog(logs);
      progress.sources = sources;
      progress.dateEnd = Date.now();
      progress.state = 'aggregated';
      await connection.setProgress(progress);

      // Create Indexs
      await targetCollection.createIndex({ _seq: 1 });
      await targetCollection.createIndex({ _id: 1 });
      await targetCollection.createIndex({ 'data.em': 1 });
      await targetCollection.createIndex({ 'data.kwBioassays': 1 });
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
