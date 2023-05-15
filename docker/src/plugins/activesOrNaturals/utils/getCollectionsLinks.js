import debugLibrary from '../../../utils/Debug.js';

const debug = debugLibrary('getCollectionLinks');
/**
 * @description Get collection links from all collections
 * @param {*} connection OctoChem connection
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
              noStereoTautomerID: '$data.ocl.noStereoTautomerID',
              source: { id: '$_id', collection: collectionName },
            },
          },
        ])
        .toArray();

      debug.trace(
        `Loaded ${results.length} noStereoTautomerIDs from ${collectionName}`,
      );
      for (const entry of results) {
        if (entry?.noStereoTautomerID) {
          if (!links[entry.noStereoTautomerID]) {
            links[entry.noStereoTautomerID] = {
              id: entry.noStereoTautomerID,
              sources: [],
            };
          }
          links[entry.noStereoTautomerID].sources.push(entry.source);
        }
      }
    }
    return { links, collectionSources };
  } catch (e) {
    if (connection) {
      debug.fatal(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
