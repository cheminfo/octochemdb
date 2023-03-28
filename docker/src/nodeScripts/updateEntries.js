import debugLibrary from '../utils/Debug.js';
import { OctoChemConnection } from '../utils/OctoChemConnection.js';

const octoChemConnection = new OctoChemConnection();

const debug = debugLibrary('updateEntries');
update()
  .catch((e) => debug(e.stack))
  .then(() => {
    debug('Done');
    octoChemConnection.close();
  });

let done = 0;

async function update() {
  const collection = (await octoChemConnection.getDatabase()).collection(
    'data',
  );
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
