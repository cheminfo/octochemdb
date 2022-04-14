import md5 from 'md5';
import MFParser from 'mf-parser';
import OCL from 'openchemlib';
import { getMF } from 'openchemlib-utils';
import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';

import Debug from '../../../utils/Debug.js';
import getActivityInfo from '../utils/getActivityInfo.js';
import getCollectionLinks from '../utils/getCollectionLinks.js';
import getGenericData from '../utils/getGenericData.js';
import getTaxonomyInfo from '../utils/getTaxonomyInfo.js';

const { MF } = MFParser;
const collectionNames = ['lotus', 'npass', 'npAtlas', 'cmaup', 'coconut']; // for taxonomy, important use order lotus, npass,npAtlas,Cmaup,Coconut
// since we know which DB gives us the most complete taxonomy, the order of importation is important when removing species duplicates
// in future a solution need to be found

const debug = Debug('aggregateDBs');

export async function aggregate(connection) {
  const options = { collection: 'bestOfCompounds', connection: connection };

  const progress = await connection.getProgress(options.collection);
  const targetCollection = await connection.getCollection(options.collection);
  let { links, colletionSources } = await getCollectionLinks(
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
    for (const [noStereoID, sourcesLink] of Object.entries(links)) {
      if (process.env.TEST === 'true' && counter > 20) break;
      if (skipping && progress.state !== 'updated') {
        if (firstID === noStereoID) {
          skipping = false;
          debug(`Skipping compound till:${firstID}`);
        }
        continue;
      }
      const data = [];
      for (const source of sourcesLink) {
        const collection = await connection.getCollection(source.collection);
        data.push(await collection.findOne({ _id: source.id }));
      }

      const molecule = OCL.Molecule.fromIDCode(noStereoID);

      const mfInfo = new MF(getMF(molecule).mf).getInfo();

      let activityInfo = await getActivityInfo(data);

      let taxons = await getTaxonomyInfo(data);

      let entry = await getGenericData(data, mfInfo);

      if (activityInfo.length > 0) entry.data.npActive = true;

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
      await temporaryCollection.createIndex({ 'data.em': 1 });
      progress.state = 'updating';

      await connection.setProgress(progress);

      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
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
}
