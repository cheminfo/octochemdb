export async function searchTaxonomies(taxonomiesCollection, searchParameter) {
  let searchResult = [];
  const cursor = taxonomiesCollection.find(searchParameter).limit(1);
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    searchResult.push(doc);
  }
  return searchResult;
}
