

const pubChemConnection = new (require('../util/PubChemConnection'))();

update()
  .catch((e) => console.log(e))
  .then(() => {
    console.log('Done');
    pubChemConnection.close();
  });

let done = 0;
async function update() {
  const collection = (await pubChemConnection.getDatabase()).collection('data');
  console.log('connected to MongoDB');
  const cursor = collection.find();
  while (await cursor.hasNext()) {
    if (done % 100000 === 0) {
      console.log('Updated: ', done);
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
