import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

/**
 * Resolves enriched taxonomy data for a COCONUT entry by looking up each
 * raw species name in the `taxonomies` MongoDB collection.
 *
 * For each taxonomy entry in `entry.data.taxonomies` the function:
 *  1. Extracts the genus (first word of the species name).
 *  2. Queries the `taxonomies` collection for a matching genus.
 *  3. When found, merges the matched taxonomy document's `data` object with
 *     the original species name and a `dbRef` back-link to the COCONUT entry.
 *  4. When not found, keeps the raw taxonomy object and attaches the `dbRef`.
 *
 * @param {CoconutEntry} entry - A COCONUT entry with optional raw taxonomies.
 * @param {import('mongodb').Collection} taxonomiesCollection - The `taxonomies`
 *   MongoDB collection.
 * @returns {Promise<CoconutTaxonomy[]>} The enriched taxonomy array.
 */
export async function getTaxonomiesForCoconuts(entry, taxonomiesCollection) {
  /** @type {CoconutTaxonomy[]} */
  const taxonomiesCoconuts = [];
  if (entry.data?.taxonomies) {
    for (let i = 0; i < entry.data.taxonomies.length; i++) {
      // coconuts taxonomies are most of times at species level while the rest are at superkingdom level
      // since species name is composed of the genus and species name, we need to check if the genus is in the taxonomies collection
      const genus = entry.data.taxonomies[i].species?.split(' ') ?? [];
      const searchParameter = {
        'data.genus': genus[0],
      };
      const result = await searchTaxonomies(
        taxonomiesCollection,
        searchParameter,
      );
      /** @type {CoconutTaxonomy} */
      let finalTaxonomy;
      if (result.length > 0) {
        finalTaxonomy = result[0].data;
        finalTaxonomy.species = entry.data.taxonomies[i].species;
      } else {
        finalTaxonomy = entry.data.taxonomies[i];
      }
      finalTaxonomy.dbRef = { $ref: 'coconuts', $id: entry._id };
      taxonomiesCoconuts.push(finalTaxonomy);
    }
  }
  return taxonomiesCoconuts;
}
