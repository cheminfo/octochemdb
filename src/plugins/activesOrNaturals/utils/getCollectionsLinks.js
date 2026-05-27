import debugLibrary from '../../../utils/Debug.js';

const debug = debugLibrary('getCollectionLinks');

/**
 * Build a map of noStereoTautomerID to source references across all collections.
 * @param connection
 * @param collectionNames - names of the source collections to scan
 * @returns
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
  } catch (/** @type {any} */ error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: error.stack,
      });
    }
  }
}
