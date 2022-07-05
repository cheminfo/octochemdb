import Debug from '../../../utils/Debug.js';

const debug = Debug('getCollectionLinks');
/**
 * @description Get collection links from all collections
 * @param {*} connection PubChem connection
 * @param {*} collectionNames Array of collection names
 * @returns {Promise} Returns the array of collection links and the array the sources in progress collection
 */
export default async function getCollectionsLinks(connection, collectionNames) {
  try {
    const links = {};
    let collectionSources = [];
    for (let collectionName of collectionNames) {
      let collection = await connection.getCollection(collectionName);
      const progressCollections = await connection.getProgress(collectionName);
      collectionSources.push(progressCollections.sources);
      let results;

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
    return { links, collectionSources };
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
