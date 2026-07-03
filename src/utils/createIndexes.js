/**
 * Sequentially create each of the given indexes on a MongoDB collection.
 * @param collection - Target collection.
 * @param indexes - Index
 * specifications to create, one per entry (e.g. `{ 'data.mf': 1 }`).
 * @returns
 */
export default async function createIndexes(collection, indexes) {
  for await (const index of indexes) {
    await collection.createIndex(index);
  }
}
