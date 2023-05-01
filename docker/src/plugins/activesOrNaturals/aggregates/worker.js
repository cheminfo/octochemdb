import { parentPort } from 'worker_threads';

import debugLibrary from '../../../utils/Debug.js';
import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';
import getActivityKeywords from '../utils/getAcitivityKeywords.js';
import getActiveAgainstKeywords from '../utils/getActiveAgainstKeywords.js';
import getActivitiesInfo from '../utils/getActivitiesInfo.js';
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
    debug(`Worker ${workerID} started`);
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
      let patentsCollection = await connection.getCollection('patents');
      let dbRefsMs = [];
      let taxons = await getTaxonomiesInfo(data, connection);
      // get unique activities from all collections for the current noStereoTautomerIDs
      let activityInfo = await getActivitiesInfo(data, connection);
      // get unique compound information from all collections for the current noStereoTautomerIDs
      entry = await getCompoundsInfo(
        entry,
        data,
        compoundsCollection,
        noStereoTautomerID,
        connection,
        patentsCollection,
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
      if (entry.data.cids) {
        const uniqueMeshTerms = {};
        const uniquePmIds = {};
        let nbPubmeds = 0;
        const pubmedCollection = await connection.getCollection('pubmeds');

        for (let i = 0; i < entry.data.cids.length; i++) {
          let cid = Number(entry.data.cids[i]);
          const { meshTermsForCid, pmIds, counterPmids } = await getMeshTerms(
            cid,
            pubmedCollection,
            connection,
          );
          nbPubmeds += Number(counterPmids);
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
        entry.data.nbPubmeds = nbPubmeds;
      }

      if (dbRefsMs.length > 0) {
        entry.data.massSpectraRefs = dbRefsMs;
        entry.data.nbMassSpectra = dbRefsMs.length;
      }
      // if activityInfo is not empty, get unique keywords of activities and target taxonomies for the current noStereoTautomerID
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
      // if taxons is not empty, get unique keywords of taxonomies for the current noStereoTautomerID
      if (taxons.length > 0) {
        const keywordsTaxonomies = getTaxonomyKeywords(taxons);
        if (keywordsTaxonomies.length > 0) {
          entry.data.kwTaxonomies = keywordsTaxonomies;
        }
      }
      // if activityInfo is not empty, define entry.data.activities
      if (activityInfo.length > 0) {
        entry.data.activities = activityInfo;
        entry.data.nbActivities = activityInfo.length;
      }
      // if taxons is not empty, define entry.data.taxonomies
      if (taxons.length > 0) {
        entry.data.taxonomies = taxons;
        entry.data.nbTaxonomies = taxons.length;
      }

      if (entry) {
        temporaryCollection.updateOne(
          { _id: noStereoTautomerID },
          { $set: entry },
          { upsert: true },
        );

        count++;
        if (Date.now() - start > Number(process.env.DEBUG_THROTTLING)) {
          // @ts-ignore
          debug(`${workerID} aggregated ${count}`);
          start = Date.now();
        }
      }
    }
    // @ts-ignore
    parentPort.postMessage(`${workerID} aggregated ${count}`);
  } catch (e) {
    debug(e);
  }
});
