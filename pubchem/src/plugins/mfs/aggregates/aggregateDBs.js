import Debug from '../../../utils/Debug.js';
const collections = [
  'cmaup',
  'coconut',
  'lotus',
  'npAtlas',
  'npass',
  'compounds',
];
const debug = Debug('aggregateDBs');
const uniqueIDs = {};
export async function aggregate(connection) {
  const targetCollection = await connection.getCollection('bestofCompounds');
  for (let i = 0; i < collections.length; i++) {
    let collection = await connection.getCollection(collections[i]);

    // fetch all noStereoID from the DB
    for (let id of collection.data.ocl.noStereoID) {
      uniqueIDs[id] = true;
    }
  }
  let array = Object.keys(uniqueIDs);
  for (let i = 0; i < collections.length; i++) {
    let collection = await connection.getCollection(collections[i]);
    for (let id of array) {
      let entry = collection[id];
      debug(entry);
    }
    // retrieve all the info in all the collections
    // join the information in a smart way ;)
    // add mf, em using OCL.Molecule.fromIdCode and then getMF https://github.com/cheminfo/docker-pubchem/blob/de2e577531484e0c8f6fb24ae008a1d0e0e6330e/pubchem/src/plugins/compounds/sync/utils/improveCompound.js#L50-L56
    // save in the new targetCollection
  }
}
