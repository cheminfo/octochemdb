const pubChemConnection = new (require('../util/PubChemConnection'))();

import Debug from '../utils/Debug.js';

const debug = Debug('updateEntries');
update()
  .catch((e) => debug(e))
  .then(() => {
    debug('Done');
    pubChemConnection.close();
  });

let done = 0;

async function update() {
  const collection = (await pubChemConnection.getDatabase()).collection('data');
  debug('connected to MongoDB');
  const cursor = collection.find();
  while (await cursor.hasNext()) {
    if (done % 100000 === 0) {
      debug(`Updated:  ${done}`);
    }
    const doc = await cursor.next();

    await collection.findOneAndUpdate(
      {
        _id: doc._id,
      },
      {
        $set: { update: true },
      },
    );

    done++;
  }
}
