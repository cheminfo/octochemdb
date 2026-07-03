/**
 * Ensures a progress entry exists for each collection and augments each with storage statistics.
 *
 * For every collection (or only `collectionToSearch` when provided) a placeholder
 * "not started" progress entry is added when none is present, then each matching
 * progress entry is enriched with `$collStats` storage statistics.
 * @param connection - Active OctoChemDB connection used to list collections and read their stats.
 * @param results - Existing progress entries to enrich; missing ones are appended.
 * @param collectionToSearch - When non-empty, limits processing to this single collection.
 * @returns The results array with placeholder entries added and storage statistics merged in.
 */
export async function getEntriesStats(connection, results, collectionToSearch) {
  let names = await connection.getCollectionNames();
  if (collectionToSearch !== '') {
    names = [collectionToSearch];
  }
  for (let name of names) {
    if (!results.some((result) => result._id === `${name}_progress`)) {
      results.push({
        _id: `${name}_progress`,
        state: 'not started',
        seq: 0,
        dateStart: 0,
        dateEnd: 0,
      });
    }
    // stats only for one collection
    const collection = await connection.getCollection(name);
    const query = await collection.aggregate([
      { $collStats: { storageStats: {} } },
    ]);
    const stats = await query.next();
    let progressResult = results.find(
      (result) => result._id === `${name}_progress`,
    );

    if (progressResult) {
      progressResult = formatStats(progressResult, stats);
      results = results.map((result) => {
        if (result._id === `${name}_progress`) {
          return progressResult;
        } else {
          return result;
        }
      });
    }
  }
  return results;
}
function formatStats(progressResult, stats) {
  progressResult.ns = stats?.ns;
  progressResult.size = stats?.storageStats?.size;
  progressResult.count = stats?.storageStats?.count;
  progressResult.avgObjSize = stats?.storageStats?.avgObjSize;
  progressResult.storageSize = stats?.storageStats?.storageSize;
  progressResult.freeStorageSize = stats?.storageStats?.freeStorageSize;
  progressResult.capped = stats?.storageStats?.capped;
  return progressResult;
}
