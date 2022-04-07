import Debug from '../../../utils/Debug.js';

async function getCollectionLinks(connection, collectionNames) {
  const debug = Debug('getCollectionLinks');
  const links = {};
  let collectionUpdatingDates = [];
  for (let collectionName of collectionNames) {
    let collection = await connection.getCollection(collectionName);
    const progressCollections = await connection.getProgress(collectionName);
    collectionUpdatingDates.push(progressCollections.date);
    const results = await collection
      .aggregate([
        {
          $project: {
            _id: 0,
            noStereoID: '$data.ocl.noStereoID',
            source: { id: '$_id', collection: collectionName },
          },
        },
      ])
      .toArray();
    debug(`Loaded ${results.length} noStereoIDs from ${collectionName}`);
    for (const entry of results) {
      if (!links[entry.noStereoID]) {
        links[entry.noStereoID] = [];
      }
      links[entry.noStereoID].push(entry.source);
    }
  }
  return { links, collectionUpdatingDates };
}

export default getCollectionLinks;
