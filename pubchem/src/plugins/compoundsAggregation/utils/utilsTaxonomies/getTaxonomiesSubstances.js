import { searchTaxonomies } from './searchTaxonomies.js';

export async function getTaxonomiesSubstances(
  entry,
  taxonomiesCollection,
  synonyms,
) {
  let taxonomiesSubstances = [];
  let newIDs = Object.keys(synonyms);
  if (entry.data?.taxonomyIDs) {
    for (let i = 0; i < entry.data.taxonomyIDs.length; i++) {
      let taxId = entry.data.taxonomyIDs[i];
      let searchParameter = {
        _id: taxId,
      };
      let result = await searchTaxonomies(
        taxonomiesCollection,
        searchParameter,
      );
      if (result.length > 0) {
        let finalTaxonomy = result[0].data;
        finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
        taxonomiesSubstances.push(finalTaxonomy);
      }
      if (result.length === 0 && newIDs.includes(taxId)) {
        let searchParameter = {
          _id: taxId,
        };
        let result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          let finalTaxonomy = result[0].data;
          finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
          taxonomiesSubstances.push(finalTaxonomy);
        }
      }
    }
  }
  if (taxonomiesSubstances.length > 0) {
    entry.data.taxonomies = taxonomiesSubstances;
  }
  return entry;
}
