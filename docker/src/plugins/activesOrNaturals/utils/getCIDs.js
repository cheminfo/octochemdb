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
          coordinates: '$data.ocl.coordinates',
        },
      },
    ])
    .toArray();

  let cids = [];
  let cidsDBRef = [];

  let molecules = {};

  for (let cid of result) {
    // create a DBRef for each cid
    cidsDBRef.push({ $ref: 'compounds', $id: cid.cid });
    cids.push(cid.cid);
    if (molecules[cid.idCode] === undefined) {
      molecules[cid.idCode] = {
        ocl: {
          idCode: cid.idCode,
          coordinates: cid.coordinates,
        },
        sources: [],
      };
    }
    molecules[cid.idCode].sources.push({
      $ref: 'compounds',
      $id: cid.cid,
    });
  }
  for (let oneDataEntry of data) {
    if (
      oneDataEntry.collection !== 'bioassays' &&
      !molecules[oneDataEntry.data.ocl.idCode === undefined]
    ) {
      molecules[oneDataEntry.data.ocl.idCode] = {
        ocl: {
          idCode: oneDataEntry.data.ocl.idCode,
          coordinates: oneDataEntry.data.ocl.coordinates,
        },
        sources: [],
      };
    }
    if (oneDataEntry.collection !== 'bioassays') {
      molecules[oneDataEntry.data.ocl.idCode].sources.push({
        $ref: oneDataEntry.collection,
        $id: oneDataEntry._id,
      });
    }
  }
  let dbRefsMolecules = Object.values(molecules);
  return { cids, cidsDBRef, dbRefsMolecules };
}
