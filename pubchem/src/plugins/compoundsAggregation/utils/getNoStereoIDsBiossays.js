import Debug from '../../../utils/Debug.js';

const debug = Debug('getNoStereoID');

export async function getNoStereoIDsBiossays(connection) {
  let counter = 0;
  const bioassaysCollection = await connection.getCollection('bioassays');
  const collection = await connection.getCollection('compounds');
  let ids = await bioassaysCollection.find({}, { _id: 1 }).map(function (item) {
    return item._id;
  });
  while (await ids.hasNext()) {
    const doc = await ids.next();

    let compound = await collection.findOne({ _id: Number(doc) });
    if (compound) {
      let noStereoID = compound.data.ocl.noStereoID;
      //debug(noStereoID);
      await bioassaysCollection.updateOne(
        { _id: doc },
        { $set: { 'data.ocl.noStereoID': noStereoID } },
        { upsert: true },
      );
      counter++;
    }
  }
  return counter;
}
