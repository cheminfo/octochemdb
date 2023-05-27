import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

export async function fixNbCompounds() {
  const connection = new OctoChemConnection();
  const collection = await connection.getCollection('patents');
  const collectionCompoundPatents = await connection.getCollection(
    'compoundPatents',
  );
  let start = Date.now();
  let count = 0;
  const cursor = collection.find({});
  const total = await collection.countDocuments({});
  while (await cursor.hasNext()) {
    const entry = await cursor.next();
    if (entry) {
      let nbCompounds = await collectionCompoundPatents.countDocuments({
        'data.patents': { $in: [entry._id] },
      });
      entry.data.nbCompounds = nbCompounds || 0;
      await collection.updateOne(
        { _id: entry._id },
        { $set: { data: entry.data } },
        { upsert: true },
      );
    }
    if (Date.now() - start > 60000) {
      start = Date.now();
      console.log(`Patents fixed ${count}/${total}`);
    }
    count++;
  }

  console.log(`Patents fixed ${count}/${total}`);

  process.exit(0);
}

await fixNbCompounds();
