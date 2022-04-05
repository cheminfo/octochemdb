import MFParser from 'mf-parser';
import OCL from 'openchemlib';
import { getMF } from 'openchemlib-utils';

import Debug from '../../../utils/Debug.js';

const { MF } = MFParser;
//const collectionNames = ['cmaup', 'coconut', 'lotus', 'npAtlas', 'npass'];
const collectionNames = ['coconut'];

const debug = Debug('aggregateDBs');
const uniqueIDs = {};
export async function aggregate(connection) {
  const targetCollection = await connection.getCollection('bestofCompounds');
  const links = {};
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

  for (const [noStereoID, sources] of Object.entries(links)) {
    const data = [];
    for (const source of sources) {
      const collection = await connection.getCollection(source.collection);
      data.push(await collection.findOne({ _id: source.id }));
    }

    // TODO combine all the data in a smart way ...
    const molecule = OCL.Molecule.fromIDCode(noStereoID);

    const mfInfo = new MF(getMF(molecule).mf).getInfo();

    const entry = {
      data: {
        em: mfInfo.monoisotopicMass,
        charge: mfInfo.charge,
        unsaturation: mfInfo.unsaturation,
        taxonomy: 'blabla',
        keywords: ['bioactive'],
      },
    };

    await targetCollection.updateOne(
      { _id: noStereoID },
      { $set: entry },
      { upsert: true },
    );
    await compoundsCollectiontargetCollectioncreateIndex({ 'data.em': 1 });

    // create
  }
}
