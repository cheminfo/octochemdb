import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

/**
 * @description get the taxonomies of the substances
 * @param {object} entry substance entry
 * @param {*} taxonomiesCollection taxonomies collection
 * @returns {Promise} taxonomies of the substance
 */
export async function getTaxonomiesSubstances(entry, taxonomiesCollection) {
  let taxonomiesSubstances = [];
  if (entry.data?.taxonomyIDs) {
    for (let i = 0; i < entry.data.taxonomyIDs.length; i++) {
      let taxId = entry.data.taxonomyIDs[i];

      let searchParameter = {
        _id: Number(taxId),
      };
      let result = await searchTaxonomies(
        taxonomiesCollection,
        searchParameter,
      );
      if (result.length > 0) {
        let finalTaxonomy = result[0].data;
        finalTaxonomy.dbRef = { $ref: 'substances', $id: entry._id };
        taxonomiesSubstances.push(finalTaxonomy);
      }
    }
  }
  if (taxonomiesSubstances.length > 0) {
    entry.data.taxonomies = taxonomiesSubstances;
  }
  return entry;
}
