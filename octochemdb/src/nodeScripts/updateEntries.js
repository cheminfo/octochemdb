import debugLibrary from '../utils/Debug.js';
import { PubChemConnection } from '../utils/PubChemConnection.js';

const pubChemConnection = new PubChemConnection();

const debug = debugLibrary('updateEntries');
update()
  .catch((e) => debug(e.stack))
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
