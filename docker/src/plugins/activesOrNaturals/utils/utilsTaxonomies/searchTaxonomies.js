/**
 * @description Search a given parameter in the taxonomies collection
 * @param {*} taxonomiesCollection Taxonomies collection
 * @param {*} searchParameter Search parameter (e.g. _id, name, etc.)
 * @returns {Promise<Array>} The results from the search
 */
export async function searchTaxonomies(taxonomiesCollection, searchParameter) {
  let searchResult = [];
  const cursor = taxonomiesCollection.find(searchParameter).limit(1);
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    searchResult.push(doc);
  }
  return searchResult;
}
