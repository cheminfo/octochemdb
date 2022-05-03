import md5 from 'md5';
import MFParser from 'mf-parser';
import OCL from 'openchemlib';
import { getMF } from 'openchemlib-utils';
import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';
import { taxonomySynonims } from '../utils/utilsTaxonomies/taxonomySynonims.js';
import Debug from '../../../utils/Debug.js';
import getActivitiesInfo from '../utils/getActivitiesInfo.js';
import getCollectionsLinks from '../utils/getCollectionsLinks.js';
import getCompoundsInfo from '../utils/getCompoundsInfo.js';
import getTaxonomiesInfo from '../utils/utilsTaxonomies/getTaxonomiesInfo.js';
import { standardizeTaxonomies } from '../utils/utilsTaxonomies/standardizeTaxonomies.js';
import { getNoStereoIDsBiossays } from '../utils/getNoStereoIDsBiossays.js';
const { MF } = MFParser;
const collectionNames = [
  'lotuses',
  'npasses',
  'npAtlases',
  'cmaups',
  'coconuts',
  'bioassays',
]; // for taxonomy, important use order lotus, npass,npAtlas,Cmaup,Coconut
// since we know which DB gives us the most complete taxonomy, the order of importation is important when removing species duplicates
// in future a solution need to be found

const debug = Debug('aggregateDBs');

export async function aggregate(connection) {
  try {
    const options = { collection: 'bestOfCompounds', connection: connection };

    const progress = await connection.getProgress(options.collection);
    const targetCollection = await connection.getCollection(options.collection);
    await targetCollection.createIndex({ _seq: 1 });
    const taxonomiesCollection = await connection.getCollection('taxonomies');
    let doIDs = false;
    if (doIDs) {
      let noStereoIDsBioassays = await getNoStereoIDsBiossays(connection);
      debug(
        `Number of noStereoIDs added to bioassays: ${noStereoIDsBioassays}`,
      );
    }

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
    let firstID;
    if (lastDocumentImported !== null) {
      firstID = lastDocumentImported._id;
    }
    let skipping = firstID !== undefined;

    let counter = 0;
    let start = Date.now();

    if (sources !== progress.sources || progress.state !== 'updated') {
      const temporaryCollection = await connection.getCollection(
        'temporaryAgregation',
      );
      debug(`Unique numbers of noStereoIDs: ${Object.keys(links).length}`);
      debug('start Aggregation process');
      let synonims = await taxonomySynonims();
      for (const [noStereoID, sourcesLink] of Object.entries(links)) {
        if (process.env.TEST === 'true' && counter > 20) break;
        if (skipping && progress.state !== 'updated') {
          if (firstID === noStereoID) {
            skipping = false;
            debug(`Skipping compound till:${firstID}`);
          }
          continue;
        }
        let data = [];

        for (const source of sourcesLink) {
          const collection = await connection.getCollection(source.collection);
          let partialData = await collection.findOne({ _id: source.id });
          partialData.collection = source.collection;
          data.push(partialData);
        }

        data = await standardizeTaxonomies(
          data,
          connection,
          synonims,
          taxonomiesCollection,
        );
        let taxons = await getTaxonomiesInfo(data, connection);

        let [activityInfo, activeTaxonomies] = await getActivitiesInfo(
          data,
          connection,
          taxonomiesCollection,
        );
        const molecule = OCL.Molecule.fromIDCode(noStereoID);
        const mfInfo = new MF(getMF(molecule).mf).getInfo();
        let entry = await getCompoundsInfo(data, mfInfo, connection);

        if (activityInfo.length > 0) entry.data.npActive = true;

        if (activityInfo.length > 0) {
          entry.data.activities = activityInfo;
        }
        if (taxons.length > 0) {
          entry.data.taxonomies = taxons;
        }
        if (activeTaxonomies.length > 0) {
          entry.data.activeAgainstTaxonomies = activeTaxonomies;
        }
        entry._seq = ++progress.seq;

        await temporaryCollection.updateOne(
          { _id: noStereoID },
          { $set: entry },
          { upsert: true },
        );
        await temporaryCollection.createIndex({ 'data.em': 1 });
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
      temporaryCollection.renameCollection(targetCollection, true); // true make mongo drop the target collection prior to renaming the collection
      logs.dateEnd = Date.now();
      logs.endSequenceID = progress.seq;
      logs.status = 'updated';
      await connection.updateImportationLog(logs);
      progress.sources = sources;
      progress.date = new Date();
      progress.state = 'updated';
      await connection.setProgress(progress);
      debug('Aggregation Done');
    } else {
      debug(`Aggregation already up to date`);
    }
    // we remove all the entries that are not imported by the last file
    const result = await targetCollection.deleteMany({
      _seq: { $lte: logs.startSequenceID },
    });
    debug(`Deleting entries with wrong source: ${result.deletedCount}`);
  } catch (e) {
    const optionsDebug = { collection: 'bestOfCompounds', connection };
    debug(e, optionsDebug);
  }
}
