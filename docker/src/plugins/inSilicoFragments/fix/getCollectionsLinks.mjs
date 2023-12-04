/* eslint-disable no-console */
export default async function getCollectionsLinks(connection) {
  try {
    const links = {};

    let collection = await connection.getCollection('activesOrNaturals');

    let results = await collection
      .aggregate([
        {
          $project: {
            _id: 0,
            idCode: '$data.noStereoOCL.idCode',
            noStereoTautomerID: '$_id',
          },
        },
      ])
      .toArray();

    for (const entry of results) {
      if (entry?.idCode) {
        if (!links[entry.noStereoTautomerID]) {
          links[entry.noStereoTautomerID] = {
            id: entry.noStereoTautomerID,
            idCode: entry.idCode,
          };
        }
      }
    }

    return links;
  } catch (e) {
    if (connection) {
      console.log(e.message);
    }
  }
}
