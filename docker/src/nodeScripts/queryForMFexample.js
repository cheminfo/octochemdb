import debugLibrary from '../utils/Debug.js';

const debug = debugLibrary('queryForMFexample');
const limit = 10;

const octochemConnection = new (require('../utils/OctoChemConnection'))();

search()
  .catch((e) => debug(e.stack))
  .then(() => {
    debug('Done');
    octochemConnection.close();
  });

async function search() {
  const collection = (await octochemConnection.getDatabase()).collection(
    'data',
  );
  debug('connected to MongoDB');
  const cursor = collection
    .find({
      charge: 0,
      nbFragments: 1,
      mf: { $regex: /^C[0-9]*H[0-9]*F?[0-9]*N?[0-9]*O?[0-9]*S?[0-9]*$/ },
    })
    .limit(limit);
  let done = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();

    if (done % 1000 === 0) {
      debug(`${new Date()}, ${done}, - Current _id: ${doc._id}`);
    }

    done++;

    debug(doc);
  }
}
