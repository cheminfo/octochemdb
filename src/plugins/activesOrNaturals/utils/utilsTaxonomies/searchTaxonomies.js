/**
 * Search the taxonomies collection for a single matching document.
 * @param taxonomiesCollection
 * @param searchParameter - MongoDB filter (e.g. `{ _id: 12345 }`)
 * @returns at most one matching document
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
