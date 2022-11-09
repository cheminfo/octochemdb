import OCL from 'openchemlib';

import Debug from '../../../utils/Debug.js';

export async function sync(connection) {
  const debug = Debug('addMissingNbFragments');
  try {
    // get compounds collection
    const collectionCompounds = await connection.getCollection('compounds');
    // get collectionCompounds count
    const count = await collectionCompounds.countDocuments();
    // iterate each entry of the collection
    const cursor = collectionCompounds.find({});
    let counter = 0;
    let fixed = 0;
    let start = Date.now();
    for await (const entry of cursor) {
      // get the oclID
      const oclID = entry.data.ocl.noStereoTautomerID;
      // get the molecule
      const molecule = OCL.Molecule.fromIDCode(oclID);

      let fragmentMap = [];
      let nbFragments = molecule.getFragmentNumbers(fragmentMap, false, false);
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
        debug(
          `Processing: counter: ${counter} - imported: ${fixed} of ${count}`,
        );
        start = Date.now();
      }
      // insert the number of fragments in the entry
      await collectionCompounds.updateOne(
        { _id: entry._id },
        { $set: { 'data.nbFragments': nbFragments } },
      );
    }
    fixed++;
  } catch (e) {
    debug(e);
  }
}
