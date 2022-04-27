import Debug from '../../../utils/Debug.js';
const debug = Debug('standardizeTaxonomies');
export async function standardizeTaxonomies(data, connection) {
  //  console.log(data);
  const taxonomiesCollection = await connection.getCollection('taxonomies');
  for (const entry of data) {
    if (entry.collection === 'lotuses') {
      console.log('ok');
      if (entry.data?.taxonomies?.ncbi) {
        let searchParameter = {
          _id: Number(entry.data.taxonomies.ncbi[0].organismID),
        };
        let result = await search(taxonomiesCollection, searchParameter);
        if (result.length > 0) {
          let finalTaxonomy = result[0].taxonomies;
          finalTaxonomy.species = result[0].organism;
          finalTaxonomy.ncbiID = result[0]._id;
          entry.data.taxonomies = finalTaxonomy;
        }
      } else {
        let sourceToBeUsed;
        if (entry.data?.taxonomies?.gBifBackboneTaxonomy?.genus) {
          sourceToBeUsed = 'gBifBackboneTaxonomy';
        } else {
          if (entry.data?.taxonomies?.openTreeOfLife?.genus) {
            sourceToBeUsed = 'openTreeOfLife';
          } else {
            if (entry.data?.taxonomies?.iNaturalist?.genus) {
              sourceToBeUsed = 'iNaturalist';
            } else {
              if (entry.data?.taxonomies?.openTreeOfLife?.genus) {
                sourceToBeUsed = 'iTIS';
              }
            }
          }
        }
        if (sourceToBeUsed === undefined) {
          debug(entry.data.taxonomies);
        }
        let searchParameter = {
          _id: Number(entry.data.taxonomies.sourceToBeUsed[0].genus),
        };
        let result = await search(taxonomiesCollection, searchParameter);
        if (result.length > 0) {
          let finalTaxonomy = result[0].taxonomies;
          finalTaxonomy.species = result[0].organism;
          finalTaxonomy.ncbiID = result[0]._id;
          entry.data.taxonomies = finalTaxonomy;
        }
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
