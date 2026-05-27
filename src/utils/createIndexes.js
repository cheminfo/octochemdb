export default async function createIndexes(collection, indexes) {
  for await (const index of indexes) {
    await collection.createIndex(index);
  }
}
