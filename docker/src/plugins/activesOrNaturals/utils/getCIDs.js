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

  let idCodes = [];
  let molecules = {};
  for (let idCode of result) {
    idCodes.push(idCode.idCode);
  }

  for (let cid of result) {
    // create a DBRef for each cid
    cidsDBRef.push({ $ref: 'compounds', $id: cid.cid });
    cids.push(cid.cid);
    molecules[cid.idCode] = {
      $ref: 'compounds',
      $id: cid.cid,
    };
  }
  for (let oneDataEntry of data) {
    if (
      !idCodes.includes(oneDataEntry.data.ocl.idCode) &&
      oneDataEntry.collection !== 'bioassays' &&
      // check if the molecule is not already in the list
      molecules[oneDataEntry.data.ocl.idCode] === undefined
    ) {
      molecules[oneDataEntry.data.ocl.idCode] = {
        $ref: oneDataEntry.collection,
        $id: oneDataEntry._id,
      };
    }
  }
  let dbRefsMolecules = Object.values(molecules);
  return { cids, cidsDBRef, dbRefsMolecules };
}
