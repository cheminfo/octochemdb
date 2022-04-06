import MFParser from 'mf-parser';
import OCL from 'openchemlib';
import { getMF } from 'openchemlib-utils';

import Debug from '../../../utils/Debug.js';

const { MF } = MFParser;
const collectionNames = ['lotus', 'npass', 'npAtlas', 'cmaup', 'coconut']; // for taxonomy, important use order lotus, npass,npAtlas,Cmaup,Coconut
// since we know which DB gives us the most complete taxonomy, the order of importation is important when removing species duplicates
// in future a solution need to be found

const debug = Debug('aggregateDBs');

export async function aggregate(connection) {
  const progress = await connection.getProgress('bestOfCompounds');
  const targetCollection = await connection.getCollection('bestOfCompounds');

  const lastDocumentImported = await getLastDocumentImported(
    connection,
    progress,
  );
  let firstId;
  let pastCount = 0;
  if (lastDocumentImported) firstId = lastDocumentImported._id;
  let skipping = firstId !== undefined;
  const links = {};
  let counter = 0;
  let start = Date.now();
  debug('get collections links');
  for (let collectionName of collectionNames) {
    let collection = await connection.getCollection(collectionName);

    const results = await collection
      .aggregate([
        {
          $project: {
            _id: 0,
            noStereoID: '$data.ocl.noStereoID',
            source: { id: '$_id', collection: collectionName },
          },
        },
      ])
      .toArray();
    for (const entry of results) {
      if (!links[entry.noStereoID]) {
        links[entry.noStereoID] = [];
      }
      links[entry.noStereoID].push(entry.source);
    }
  }
  debug('start Aggregation process');
  for (const [noStereoID, sources] of Object.entries(links)) {
    if (process.env.TEST === 'true' && counter > 20) break;
    if (skipping) {
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

    // TODO combine all the data in a smart way ...
    const molecule = OCL.Molecule.fromIDCode(noStereoID);

    const mfInfo = new MF(getMF(molecule).mf).getInfo();
    let cid = {};
    let cas = {};
    let iupacName = {};
    let activityInfo = [];
    let taxons = [];
    let ocls = {};
    for (const info of data) {
      ocls[info.data.ocl.id] = info.data.ocl;
      if (info.data?.cid) cid[info.data?.cid] = true;
      if (info.data?.cas) cas[info.data?.cas] = true;
      if (info.data?.iupacName) iupacName[info.data?.iupacName] = true;
      // activity part
      if (info.data?.activities) {
        activityInfo.push(info.data?.activities);
      }
      if (!info._source.includes('lotus')) {
        if (info.data?.taxonomies) {
          for (const taxonomy of info.data.taxonomies) {
            taxonomy.ref = info._source;
            taxons.push(taxonomy);
          }
        }
      } else {
        if (info.data?.taxonomies?.ncbi) {
          for (const taxonomy of info.data.taxonomies.ncbi) {
            taxonomy.ref = info._source;
            taxons.push(taxonomy);
          }
        }
        if (info.data?.taxonomies?.gBifBackboneTaxonomy) {
          for (const taxonomy of info.data.taxonomies.gBifBackboneTaxonomy) {
            taxonomy.ref = info._source;
            taxons.push(taxonomy);
          }
        }
        if (info.data?.taxonomies?.iNaturalist) {
          for (const taxonomy of info.data.taxonomies.iNaturalist) {
            taxonomy.ref = info._source;
            taxons.push(taxonomy);
          }
        }
        if (info.data?.taxonomies?.openTreeOfLife) {
          for (const taxonomy of info.data.taxonomies.openTreeOfLife) {
            taxonomy.ref = info._source;
            taxons.push(taxonomy);
          }
        }
        if (info.data?.taxonomies?.iTIS) {
          for (const taxonomy of info.data.taxonomies.iTIS) {
            taxonomy.ref = info._source;
            taxons.push(taxonomy);
          }
        }
      }
    }

    if (activityInfo.length > 0) {
      activityInfo = activityInfo[0];
      try {
        activityInfo = activityInfo.filter(
          (elem, index, self) =>
            self.findIndex((activity) => {
              return (
                activity.refId === elem.refId &&
                activity.refIdType === elem.refIdType &&
                activity.activityType === elem.activityType &&
                activity.activityValue === elem.activityValue
              );
            }) === index,
        );
      } catch (e) {
        debug(e.stack);
      }
    }

    if (taxons.length > 0) {
      try {
        taxons = taxons.filter(
          (elem, index, self) =>
            self.findIndex((taxonomy) => {
              return taxonomy.species === elem.species;
            }) === index,
        );
      } catch (e) {
        debug(e);
      }
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
  progress.state = 'updated';
  await connection.setProgress(progress);
  debug('Done');
}

async function getLastDocumentImported(connection, progress) {
  const collection = await connection.getCollection('bestOfCompounds');
  return collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();
}
