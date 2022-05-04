import Debug from '../../../../utils/Debug.js';

const debug = Debug('getNoStereoID');

export async function insertNoStereoIDsAndTaxonomies(connection) {
  let counter = 0;
  let start = Date.now();
  const taxonomiesCollection = await connection.getCollection('taxonomies');
  const bioassaysCollection = await connection.getCollection('bioassays');
  let total = await bioassaysCollection.count();
  const collection = await connection.getCollection('compounds');
  let ids = await bioassaysCollection.find({}, { _id: 1 }).map(function (item) {
    return item;
  });
  while (await ids.hasNext()) {
    const doc = await ids.next();
    let cid = doc.data.cid;
    let compound = await collection.findOne({ _id: Number(cid) });
    if (compound) {
      let taxonomies = [];

      if (doc.data.activeAgainsTaxIDs) {
        for (let i = 0; i < doc.data.activeAgainsTaxIDs.length; i++) {
          let taxons = await taxonomiesCollection.findOne({
            _id: Number(doc.data.activeAgainsTaxIDs[i]),
          });
          if (taxons) {
            taxonomies.push(taxons.data);
          }
        }
      }
      let noStereoID = compound.data.ocl.noStereoID;
      let set;
      if (taxonomies.length > 0) {
        set = {
          'data.ocl.noStereoID': noStereoID,
          'data.activeAgainstTaxonomy': taxonomies,
        };
      } else {
        set = {
          'data.ocl.noStereoID': noStereoID,
        };
      }
      await bioassaysCollection.updateOne(
        { _id: doc._id },
        {
          $set: set,
        },
        { upsert: true },
      );

      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
        let percentage = Math.round((counter / total) * 1000) / 10;
        debug(
          `Processing: imported: ${counter} of ${total} ---> ${percentage} %`,
        );
        start = Date.now();
      }
      counter++;
    }
  }
  return counter;
}
