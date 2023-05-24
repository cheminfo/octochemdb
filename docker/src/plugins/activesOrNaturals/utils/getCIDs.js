export default async function getCIDs(connection, noStereoTautomerID, data) {
  let compoundsCollection = await connection.getCollection('compounds');
  let result = await compoundsCollection
    .aggregate([
      { $match: { 'data.ocl.noStereoTautomerID': noStereoTautomerID } },
      {
        $project: {
          _id: 0,
          // get the id named as cid
          cid: '$_id',
          idCode: '$data.ocl.idCode',
        },
      },
    ])
    .toArray();
  let cids = [];
  let cidsDBRef = [];
  let dbRefsMolecules = [];
  let idCodes = [];
  for (let idCode of result) {
    idCodes.push(idCode.idCode);
  }
  if (result.length > 0) {
    for (let cid of result) {
      // create a DBRef for each cid
      cidsDBRef.push({ $ref: 'compounds', $id: cid.cid });
      cids.push(cid.cid);
      dbRefsMolecules.push({
        $ref: 'compounds',
        $id: cid.cid,
      });
      for (let oneDataEntry of data) {
        if (
          !idCodes.includes(oneDataEntry.data.ocl.idCode) &&
          oneDataEntry.collection !== 'bioassays'
        ) {
          dbRefsMolecules.push({
            $ref: oneDataEntry.collection,
            $id: oneDataEntry._id,
          });
        }
      }
    }
  }
  return { cids, cidsDBRef, dbRefsMolecules };
}
