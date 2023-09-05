import { parentPort } from 'worker_threads';

import debugLibrary from '../../../utils/Debug.js';
import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';
import getActiveAgainstKeywords from '../utils/getActiveAgainstKeywords.js';
import getActivitiesInfo from '../utils/getActivitiesInfo.js';
import getActivityKeywords from '../utils/getActivityKeywords.js';
import getCompoundsInfo from '../utils/getCompoundsInfo.js';
import { getMassSpectraRefForGNPs } from '../utils/getMassSpectraRefForGNPs.js';
import { getMassSpectraRefForMassBank } from '../utils/getMassSpectraRefForMassBank.js';
import { getMeshTerms } from '../utils/getMeshTerms.js';
import getTaxonomyKeywords from '../utils/getTaxonomyKeywords.js';
import getTaxonomiesInfo from '../utils/utilsTaxonomies/getTaxonomiesInfo.js';

const connection = new OctoChemConnection();
const debug = debugLibrary('WorkerProcess');
parentPort?.on('message', async (dataEntry) => {
  try {
    const { links, workerID } = dataEntry;
    debug.trace(`Worker ${workerID} started`);
    // get worker number
    const temporaryCollection = await connection.getCollection(
      `activesOrNaturals_tmp`,
    );
    let count = 0;
    let start = Date.now();
    for (const link of links) {
      let noStereoTautomerID = link.id;
      let sources = link.sources;
      let entry = { data: { naturalProduct: false } };
      // get all documents from all collections
      let data = [];
      for (const source of sources) {
        if (
          [
            'npasses',
            'cmaups',
            'coconuts',
            'lotuses',
            'npAtlases',
            'gnps',
          ].includes(source.collection)
        ) {
          entry.data.naturalProduct = true;
        }

        const collection = await connection.getCollection(source.collection);
        let partialData = await collection.findOne({ _id: source.id });
        if (partialData) {
          partialData.collection = source.collection;
          data.push(partialData);
        }
      }
      let compoundsCollection = await connection.getCollection('compounds');
      let compoundPatentsCollection =
        await connection.getCollection('compoundPatents');
      let dbRefsMs = [];
      let taxons = await getTaxonomiesInfo(data, connection);
      // get unique activities from all collections for the current noStereoTautomerIDs
      let { activityInfos, activityDBRef } = await getActivitiesInfo(
        data,
        connection,
      );
      // get unique compound information from all collections for the current noStereoTautomerIDs
      entry = await getCompoundsInfo(
        entry,
        data,
        compoundsCollection,
        noStereoTautomerID,
        connection,
        compoundPatentsCollection,
      );
      let massSpectraRefsForGNPs = await getMassSpectraRefForGNPs(
        connection,
        noStereoTautomerID,
      );
      massSpectraRefsForGNPs.forEach((ref) => {
        dbRefsMs.push(ref.dbRef);
      });
      let massSpectraRefsForMassBank = await getMassSpectraRefForMassBank(
        connection,
        noStereoTautomerID,
      );
      massSpectraRefsForMassBank.forEach((ref) => {
        dbRefsMs.push(ref.dbRef);
      });
      entry.data.nbPubmeds = 0;
      entry.data.nbMassSpectra = 0;
      entry.data.nbTaxonomies = 0;
      entry.data.nbActivities = 0;
      if (entry.data.compounds) {
        const uniqueMeshTerms = {};
        const uniquePmIds = {};
        let nbPubmeds = 0;
        const pubmedCollection = await connection.getCollection('pubmeds');

        const { meshTermsForCid, pmIds, counterPmids } = await getMeshTerms(
          entry.data.compounds,
          pubmedCollection,
          connection,
        );
        delete entry.data.compounds;
        nbPubmeds += Number(counterPmids);
        meshTermsForCid.forEach((term) => {
          uniqueMeshTerms[term] = true;
        });
        pmIds.forEach((id) => {
          uniquePmIds[id] = true;
        });

        let dbRefs = Object.keys(uniquePmIds).map((id) => ({
          $ref: 'pubmeds',
          $id: id,
        }));

        const meshTerms = Object.keys(uniqueMeshTerms);

        if (meshTerms.length > 0) {
          // sort mesh terms by alphabetical order
          meshTerms.sort();
          entry.data.kwMeshTerms = meshTerms;
        }
        if (dbRefs.length > 0) {
          entry.data.pubmeds = dbRefs;
        }
        entry.data.nbPubmeds += nbPubmeds;
      }

      if (dbRefsMs.length > 0) {
        entry.data.massSpectra = dbRefsMs;
        entry.data.nbMassSpectra += dbRefsMs.length;
      }
      // if activityInfo is not empty, get unique keywords of activities and target taxonomies for the current noStereoTautomerID
      if (activityInfos?.length > 0) {
        entry.data.bioactive = true;
        const keywordsActivities = getActivityKeywords(activityInfos);
        if (keywordsActivities.length > 0) {
          keywordsActivities.sort();
          entry.data.kwBioassays = keywordsActivities;
        }
        const keywordsActiveAgainst = getActiveAgainstKeywords(activityInfos);

        if (keywordsActiveAgainst.length > 0) {
          keywordsActiveAgainst.sort();
          entry.data.kwActiveAgainst = keywordsActiveAgainst;
        }
      }
      // if taxons is not empty, get unique keywords of taxonomies for the current noStereoTautomerID
      if (taxons.length > 0) {
        const keywordsTaxonomies = getTaxonomyKeywords(taxons);
        if (keywordsTaxonomies.length > 0) {
          entry.data.kwTaxonomies = keywordsTaxonomies;
        }
      }
      // if activityInfo is not empty, define entry.data.activities
      if (activityDBRef.length > 0) {
        entry.data.activities = activityDBRef;
        entry.data.nbActivities += activityInfos.length;
      }
      // if taxons is not empty, define entry.data.taxonomies
      if (taxons.length > 0) {
        entry.data.taxonomies = taxons;
        entry.data.nbTaxonomies += taxons.length;
      }

      if (entry) {
        temporaryCollection.updateOne(
          { _id: noStereoTautomerID },
          { $set: entry },
          { upsert: true },
        );

        count++;
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          parentPort?.postMessage({
            workerID,
            currentCount: count,
            status: 'running',
          });
          start = Date.now();
        }
      }
    }
    // @ts-ignore
    parentPort.postMessage({ workerID, currentCount: count, status: 'done' });
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
});
