import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

/**
 * Enrich a substance entry with taxonomy data from the taxonomies collection.
 *
 * For each taxonomy ID referenced in `entry.data.taxonomyIDs`, looks up the
 * taxonomy document and attaches it (with a dbRef back to the substance) to
 * `entry.data.taxonomies`.
 *
 * @param {object} entry - substance document (mutated in place)
 * @param {import('mongodb').Collection} taxonomiesCollection - MongoDB taxonomies collection
 * @returns {Promise<object>} the enriched entry
 */
export async function getTaxonomiesSubstances(entry, taxonomiesCollection) {
  const taxonomiesSubstances = [];
  if (entry.data?.taxonomyIDs) {
    for (let i = 0; i < entry.data.taxonomyIDs.length; i++) {
      const taxId = entry.data.taxonomyIDs[i];

      const searchParameter = {
        _id: Number(taxId),
      };
      const result = await searchTaxonomies(
        taxonomiesCollection,
        searchParameter,
      );
      if (result.length > 0) {
        const finalTaxonomy = result[0].data;
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
