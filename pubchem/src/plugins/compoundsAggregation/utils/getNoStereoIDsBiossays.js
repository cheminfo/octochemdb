import Debug from '../../../utils/Debug.js';

const debug = Debug('getNoStereoID');

export async function getNoStereoIDsBiossays(connection) {
  let counter = 0;
  const taxonomiesCollection = await connection.getCollection('taxonomies');
  const bioassaysCollection = await connection.getCollection('bioassays');
  const collection = await connection.getCollection('compounds');
  let ids = await bioassaysCollection.find({}, { _id: 1 }).map(function (item) {
    let assays = { id: item._id, bioassays: item?.data?.bioassays };
    return assays;
  });
  while (await ids.hasNext()) {
    const doc = await ids.next();
    let compound = await collection.findOne({ _id: Number(doc.id) });
    if (compound) {
      if (counter > 206) {
        debug(doc.id);
      }
      let taxonomies = [];
      let taxon = {};
      for (let i = 0; i < doc?.bioassays.length; i++) {
        let aid = doc?.bioassays[i]?.aid;

        if (doc?.bioassays[i]?.activeAgainsTaxIDs) {
          for (let id of doc?.bioassays[i].activeAgainsTaxIDs) {
            let taxons = await taxonomiesCollection.findOne({
              _id: Number(id),
            });
            if (taxons) {
              if (!taxon[taxons._id]) {
                taxon[taxons._id] = taxons.data;
                taxon[taxons._id].aid = [aid];
                continue;
              }
              if (taxon[taxons._id]) {
                taxon[taxons._id].aid.push(aid);
              }
            }
          }
          let keys = Object.keys(taxon);
          if (keys.length > 0) {
            for (let key of keys) {
              taxonomies.push(taxon[key]);
            }
          }
        }
      }

      let noStereoID = compound.data.ocl.noStereoID;
      let set;
      if (taxonomies.length > 0) {
        set = {
          'data.ocl.noStereoID': noStereoID,
          'data.taxonomies': taxonomies,
        };
      } else {
        set = {
          'data.ocl.noStereoID': noStereoID,
        };
      }
      await bioassaysCollection.updateOne(
        { _id: doc.id },
        {
          $set: set,
        },
        { upsert: true },
      );
      counter++;
      debug(counter);
    }
  }
  return counter;
}
