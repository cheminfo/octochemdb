import Debug from '../../../utils/Debug.js';
const debug = Debug('standardizeTaxonomies');
export async function standardizeTaxonomies(data, connection) {
  //  console.log(data);
  const taxonomiesCollection = await connection.getCollection('taxonomies');
  for (const entry of data) {
    if (entry.collection === 'lotuses') {
      if (entry.data?.taxonomies?.ncbi[0]?.organismID) {
        let searchParameter = {
          _id: Number(entry.data.taxonomies.ncbi[0].organismID),
        };
        let result = await search(taxonomiesCollection, searchParameter);
        debug(searchParameter);
        debug(result);
      }
    }
  }
}

export async function search(taxonomiesCollection, searchParameter) {
  let searchResult = [];
  const cursor = taxonomiesCollection.find(searchParameter).limit(10);
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    searchResult.push(doc);
  }
  return searchResult;
}
