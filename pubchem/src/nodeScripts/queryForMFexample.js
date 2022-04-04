const limit = 10;

const pubChemConnection = new (require('../util/PubChemConnection'))();

search()
  .catch((e) => console.log(e))
  .then(() => {
    console.log('Done');
    pubChemConnection.close();
  });

async function search() {
  const collection = (await pubChemConnection.getDatabase()).collection('data');
  console.log('connected to MongoDB');
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
    const mf = doc.mf;

    if (done % 1000 === 0) {
      console.log(new Date(), done, '- Current _id:', doc._id);
    }

    done++;

    console.log(doc);
  }
}
