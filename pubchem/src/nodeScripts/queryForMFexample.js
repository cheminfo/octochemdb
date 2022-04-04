import Debug from '../utils/Debug.js';

const debug = Debug('queryForMFexample');
const limit = 10;

const pubChemConnection = new (require('../util/PubChemConnection'))();

search()
  .catch((e) => debug(e))
  .then(() => {
    debug('Done');
    pubChemConnection.close();
  });

async function search() {
  const collection = (await pubChemConnection.getDatabase()).collection('data');
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
