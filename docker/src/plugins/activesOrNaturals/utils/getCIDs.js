export default async function getCIDs(connection, noStereoTautomerID, data) {
  let compoundsCollection = await connection.getCollection('compounds');
  let titleCollection = await connection.getCollection('titleCompounds');
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
    if (!molecules[cid.idCode]) {
      molecules[cid.idCode] = {
        ocl: {
          idCode: cid.idCode,
          coordinates: cid.coordinates,
        },
        sources: [],
        titles: [],
      };
    }
    let titleEntry = await titleCollection.findOne({ _id: Number(cid.cid) });
    if (titleEntry && titleEntry.data.title.length < 30) {
      molecules[cid.idCode].titles.push(titleEntry.data.title);
    }
    molecules[cid.idCode].sources.push({
      $ref: 'compounds',
      $id: cid.cid,
    });
  }
  for (let oneDataEntry of data) {
    if (oneDataEntry.collection === 'bioassays') continue;
    const idCode = oneDataEntry.data.ocl.idCode;
    if (!molecules[idCode]) {
      molecules[oneDataEntry.data.ocl.idCode] = {
        ocl: {
          idCode,
          coordinates: oneDataEntry.data.ocl.coordinates,
        },
        sources: [],
      };
    }
    molecules[idCode].sources.push({
      $ref: oneDataEntry.collection,
      $id: oneDataEntry._id,
    });
  }
  let dbRefsMolecules = Object.values(molecules);
  return { cids, cidsDBRef, dbRefsMolecules };
}
