/**
 * Return storage statistics for a collection via the `$collStats` aggregation
 * stage (namespace, document count, sizes, capped flag).
 * @param connection - Active DB
 * connection wrapper.
 * @param collectionName - Collection to inspect.
 * @returns Flattened subset of the collection storage stats.
 */
export async function getStats(connection, collectionName) {
  const collection = await connection.getCollection(collectionName);
  const query = await collection.aggregate([
    { $collStats: { storageStats: {} } },
  ]);
  const stats = await query.next();
  return {
    ns: stats?.ns,
    size: stats?.storageStats.size,
    count: stats?.storageStats.count,
    avgObjSize: stats?.storageStats.avgObjSize,
    storageSize: stats?.storageStats.storageSize,
    freeStorageSize: stats?.storageStats.freeStorageSize,
    capped: stats?.storageStats.capped,
  };
}
