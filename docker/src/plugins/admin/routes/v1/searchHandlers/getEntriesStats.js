export async function getEntriesStats(connection, results, collectionToSearch) {
  let names = await connection.getCollectionNames();
  if (collectionToSearch !== '') {
    names = [collectionToSearch];
  }
  for (let name of names) {
    if (!results.find((result) => result._id === `${name}_progress`)) {
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
