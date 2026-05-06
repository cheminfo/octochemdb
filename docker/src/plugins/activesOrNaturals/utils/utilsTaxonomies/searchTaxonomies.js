/**
 * Search the taxonomies collection for a single matching document.
 * @param {import('mongodb').Collection} taxonomiesCollection
 * @param {Record<string, unknown>} searchParameter - MongoDB filter (e.g. `{ _id: 12345 }`)
 * @returns {Promise<Array<Record<string, any>>>} at most one matching document
 */
export async function searchTaxonomies(taxonomiesCollection, searchParameter) {
  let searchResult = [];
  const cursor = taxonomiesCollection.find(searchParameter).limit(1);
  while (await cursor.hasNext()) {
    let doc = await cursor.next();
    searchResult.push(doc);
  }
  return searchResult;
}
