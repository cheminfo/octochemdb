import Debug from '../../../utils/Debug.js';
const debug = Debug('getCollectionLinks');

async function getCollectionsLinks(connection, collectionNames) {
  try {
    const links = {};
    let colletionSources = [];
    for (let collectionName of collectionNames) {
      let collection = await connection.getCollection(collectionName);
      const progressCollections = await connection.getProgress(collectionName);
      colletionSources.push(progressCollections.sources);
      let results;
      if (collectionName === 'substances') {
        results = await collection
          .aggregate([
            {
              $match: {
                $and: [
                  { naturalProduct: true },
                  { 'data.ocl.id': { $ne: 'd@' } },
                ],
              },
            },
            {
              $project: {
                _id: 0,
                noStereoID: '$data.ocl.noStereoID',
                source: { id: '$_id', collection: collectionName },
              },
            },
          ])
          .toArray();
      } else {
        results = await collection
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
      }
      debug(`Loaded ${results.length} noStereoIDs from ${collectionName}`);
      for (const entry of results) {
        if (entry?.noStereoID) {
          if (!links[entry.noStereoID]) {
            links[entry.noStereoID] = [];
          }
          links[entry.noStereoID].push(entry.source);
        }
      }
    }
    return { links, colletionSources };
  } catch (e) {
    const optionsDebug = { collection: 'activesOrNaturals', connection };
    debug(e, optionsDebug);
  }
}

export default getCollectionsLinks;
