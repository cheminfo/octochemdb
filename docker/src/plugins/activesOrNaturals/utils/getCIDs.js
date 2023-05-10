export default async function getCIDs(connection, noStereoTautomerID) {
  let compoundsCollection = await connection.getCollection('compounds');
  let result = await compoundsCollection
    .aggregate([
      { $match: { 'data.ocl.noStereoTautomerID': noStereoTautomerID } },
      {
        $project: {
          _id: 0,
          // get the id named as cid
          cid: '$_id',
        },
      },
    ])
    .toArray();
  let cids = [];
  let cidsDBRef = [];
  if (result.length > 0) {
    for (let cid of result) {
      // create a DBRef for each cid
      cidsDBRef.push({ $ref: 'compounds', $id: cid.cid });
      cids.push(cid.cid);
    }
  }
  return { cids, cidsDBRef };
}
