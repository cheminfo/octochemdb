import MFParser from 'mf-parser';
import OCL from 'openchemlib';
import { getMF } from 'openchemlib-utils';
import getLastDocumentImported from '../../../sync/http/utils/getLastDocumentImported.js';

import Debug from '../../../utils/Debug.js';
import getActivityInfo from '../utils/getActivityInfo.js';
import getCollectionLinks from '../utils/getCollectionLinks.js';
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
  const lastDocumentImported = await getLastDocumentImported(
    options.connection,
    progress,
    options.collection,
  );
  let firstId;
  let pastCount = 0;
  if (lastDocumentImported) firstId = lastDocumentImported._id;
  let skipping = firstId !== undefined;

  let counter = 0;
  let start = Date.now();

  let { links, collectionUpdatingDates } = await getCollectionLinks(
    connection,
    collectionNames,
  );
  let oldLastImports;
  if (progress.lastImports !== null) {
    oldLastImports = progress.lastImports;
  } else {
    oldLastImports = [' '];
  }

  let status = false;
  for (let i = 0; i < collectionUpdatingDates.length; i++) {
    if (
      collectionUpdatingDates[i].toString() === oldLastImports[i].toString()
    ) {
      status = true;
    }
    if (!status) break;
  }

  if (status === false || progress.state !== 'updated') {
    debug(`Unique numbers of noStereoIDs: ${Object.keys(links).length}`);
    debug('start Aggregation process');
    for (const [noStereoID, sources] of Object.entries(links)) {
      if (process.env.TEST === 'true' && counter > 20) break;
      if (skipping && progress.state !== 'updated') {
        if (firstId === noStereoID) {
          skipping = false;
          pastCount = lastDocumentImported._seq;
          debug(`Skipping compound till:${pastCount}`);
        }
        continue;
      }
      const data = [];
      for (const source of sources) {
        const collection = await connection.getCollection(source.collection);
        data.push(await collection.findOne({ _id: source.id }));
      }

      const molecule = OCL.Molecule.fromIDCode(noStereoID);

      const mfInfo = new MF(getMF(molecule).mf).getInfo();

      let activityInfo = await getActivityInfo(data);

      let taxons = await getTaxonomyInfo(data);
      let cid = {};
      let cas = {};
      let iupacName = {};
      let ocls = {};
      for (const info of data) {
        ocls[info.data.ocl.id] = {
          id: info.data.ocl.id,
          coordinates: info.data.ocl.coordinates,
        };
        if (info.data?.cid) cid[info.data?.cid] = true;
        if (info.data?.cas) cas[info.data?.cas] = true;
        if (info.data?.iupacName) iupacName[info.data?.iupacName] = true;
      }

      let npActive = false;
      if (activityInfo.length > 0) npActive = true;
      const entry = {
        data: {
          em: mfInfo.monoisotopicMass,
          charge: mfInfo.charge,
          unsaturation: mfInfo.unsaturation,
          npActive: npActive,
        },
      };
      if (activityInfo.length > 0) {
        entry.data.activities = activityInfo;
      }
      if (taxons.length > 0) {
        entry.data.taxonomies = taxons;
      }
      ocls = Object.values(ocls);
      cid = Object.keys(cid);
      cas = Object.keys(cas);
      iupacName = Object.keys(iupacName);
      if (ocls.length > 0) entry.data.ocls = ocls;
      if (cid.length > 0) entry.data.cids = cid;
      if (cas.length > 0) entry.data.cas = cas;
      if (iupacName.length > 0) entry.data.iupacName = iupacName;

      entry._seq = ++progress.seq;

      await targetCollection.updateOne(
        { _id: noStereoID },
        { $set: entry },
        { upsert: true },
      );
      await targetCollection.createIndex({ 'data.em': 1 });
      progress.state = 'updating';

      await connection.setProgress(progress);

      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
        debug(`Processing: counter: ${counter + pastCount} `);
        start = Date.now();
      }

      counter++;
    }
    progress.date = new Date();
    progress.state = 'updated';
    progress.lastImports = collectionUpdatingDates;
    await connection.setProgress(progress);
    debug('Done');
  } else {
    debug(`Aggregation already up to date`);
  }
  // we remove all the entries that are not imported by the last file
  const result = await targetCollection.deleteMany({
    _source: { $ne: collectionUpdatingDates },
  });
  debug(`Deleting entries with wrong source: ${result.deletedCount}`);
}
