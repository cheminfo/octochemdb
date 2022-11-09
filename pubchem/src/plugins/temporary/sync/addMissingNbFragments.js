import Debug from '../../../utils/Debug.js';

import improvePool from './improvePool.js';

export async function sync(connection) {
  const debug = Debug('addMissingNbFragments');
  try {
    // get compounds collection
    const collectionCompounds = await connection.getCollection('compounds');
    // get collectionCompounds count
    // iterate each entry of the collection in parallel to n-1 cpu
    // iterate each entry wich has not nbFragments
    const cursor = collectionCompounds.find({
      'data.nbFragments': { $exists: false },
    });

    let actions = [];
    for await (const entry of cursor) {
      actions.push(
        improvePool(entry).then((result) => {
          return collectionCompounds.updateOne(
            { _id: result._id },
            { $set: result },
            { upsert: true },
          );
        }),
      );
    }

    // insert the number of fragments in the entry
    await Promise.all(actions);
  } catch (e) {
    debug(e);
  }
}
