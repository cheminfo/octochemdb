import md5 from 'md5';

import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import Debug from '../../../utils/Debug.js';
import getActivitiesInfo from '../utils/getActivitiesInfo.js';
import getCollectionsLinks from '../utils/getCollectionsLinks.js';
import getCompoundsInfo from '../utils/getCompoundsInfo.js';
import { getActivityKeywords } from '../utils/getAcitivityKeywords.js';
import { getTaxonomyKeywords } from '../utils/getTaxonomyKeywords.js';
import getTaxonomiesInfo from '../utils/utilsTaxonomies/getTaxonomiesInfo.js';
import { standardizeTaxonomies } from '../utils/utilsTaxonomies/standardizeTaxonomies.js';
import { taxonomySynonims as taxonomySynonyms } from '../utils/utilsTaxonomies/taxonomySynonims.js';

const collectionNames = [
  // 'lotuses',
  'npasses',
  'npAtlases',
  'cmaups',
  //'coconuts',
  //'substances',
  //'bioassays',
];

const debug = Debug('aggregateDBs');

const COLLECTION_NAME="activesOrNaturals"

export async function aggregate(connection) {
  try {
    const options = { collection: COLLECTION_NAME, connection: connection };'
    const progress = await connection.getProgress(options.collection);
    const targetCollection = await connection.getCollection(options.collection);
    const taxonomiesCollection = await connection.getCollection('taxonomies');
    const compoundsCollection = await connection.getCollection('compounds');
    let { links, colletionSources } = await getCollectionsLinks(
      connection,
      collectionNames,
    );
    const sources = md5(colletionSources);
    const logs = await connection.geImportationtLog({
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
        COLLECTION_NAME+'_tmp',
      );
      debug(`Unique numbers of noStereoIDs: ${Object.keys(links).length}`);
      debug('start Aggregation process');
      let synonyms = await taxonomySynonyms();

      for (const [noStereoID, sourcesLink] of Object.entries(links)) {
        let data = [];
        let collectionSources = [];
        for (const source of sourcesLink) {
          const collection = await connection.getCollection(source.collection);
          let partialData = await collection.findOne({ _id: source.id });
          partialData.collection = source.collection;
          data.push(partialData);
          collectionSources.push(source.collection);
        }

        data = await standardizeTaxonomies(
          data,
          synonyms,
          taxonomiesCollection,
        );
        let taxons = await getTaxonomiesInfo(data, connection);

        let activityInfo = await getActivitiesInfo(
          data,
          connection,
          taxonomiesCollection,
        );

        let entry = await getCompoundsInfo(
          data,
          compoundsCollection,
          noStereoID,
          connection,
        );

        if (activityInfo.length > 0) {
          entry.data.active = true;
        }

        const keywordsActivities = getActivityKeywords(activityInfo);
        if (keywordsActivities.length > 0) {
          entry.data.kwBioassays = keywordsActivities;
        }

        const keywordsTaxonomies = getTaxonomyKeywords(taxons);
        if (keywordsTaxonomies.length > 0) {
          entry.data.kwTaxonomies = keywordsTaxonomies;
        }

        if (activityInfo.length > 0) {
          entry.data.activities = activityInfo;
        }

        if (taxons.length > 0) {
          entry.data.taxonomies = taxons;
        }

        if (
          taxons.length > 0 ||
          collectionSources.includes(
            'npasses' || 'cmaups' || 'coconuts' || 'lotuses' || 'npAtlases',
          )
        ) {
          entry.data.naturalProduct = true;
        }

        entry._seq = ++progress.seq;

        await temporaryCollection.updateOne(
          { _id: noStereoID },
          { $set: entry },
          { upsert: true },
        );

        progress.state = 'updating';

        await connection.setProgress(progress);

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
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      progress.sources = sources;
      progress.date = new Date();
      progress.state = 'updated';
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
    const optionsDebug = { collection: 'activesOrNaturals', connection };
    debug(e, optionsDebug);
  }
}
