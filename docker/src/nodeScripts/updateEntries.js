import debugLibrary from '../utils/Debug.js';
import { OctoChemConnection } from '../utils/OctoChemConnection.js';

const octoChemConnection = new OctoChemConnection();

const debug = debugLibrary('updateEntries');
update()
  .catch((e) => debug.fatal(e.stack))
  .then(() => {
    debug.trace('Done');
    octoChemConnection.close();
  });

let done = 0;

async function update() {
  const collection = (await octoChemConnection.getDatabase()).collection(
    'data',
  );
  debug.trace('connected to MongoDB');
  const cursor = collection.find();
  while (await cursor.hasNext()) {
    if (done % 100000 === 0) {
      debug.trace(`Updated:  ${done}`);
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
