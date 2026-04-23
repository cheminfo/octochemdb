import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

/**
 * Resolves enriched taxonomy data for a LOTUS V2 entry by looking up each
 * taxon in the `taxonomies` MongoDB collection.
 *
 * For each taxonomy entry in `entry.data.taxonomies` the function:
 *  1. Extracts the genus (first word of the species/taxon name).
 *  2. Queries the `taxonomies` collection for a matching genus.
 *  3. When found, merges the matched taxonomy document's `data` object with
 *     the original species name, reference, and a `dbRef` back-link.
 *  4. When not found, keeps the raw taxonomy object and attaches the `dbRef`.
 *
 * @param {LotusV2Entry} entry - A LOTUS V2 entry with optional raw taxonomies.
 * @param {import('mongodb').Collection} taxonomiesCollection - The `taxonomies`
 *   MongoDB collection.
 * @returns {Promise<Array>} The enriched taxonomy array.
 */
export async function getTaxonomiesForLotusesV2(entry, taxonomiesCollection) {
  const taxonomies = [];
  if (!entry.data?.taxonomies) return taxonomies;

  for (let i = 0; i < entry.data.taxonomies.length; i++) {
    const rawTaxon = entry.data.taxonomies[i];
    const speciesName = rawTaxon.species;
    const genus = speciesName ? speciesName.split(' ')[0] : undefined;

    let finalTaxonomy;

    if (genus) {
      const result = await searchTaxonomies(taxonomiesCollection, {
        'data.genus': genus,
      });
      if (result.length > 0) {
        finalTaxonomy = { ...result[0].data };
        if (speciesName) {
          finalTaxonomy.species = speciesName;
        }
      }
    }

    if (!finalTaxonomy) {
      finalTaxonomy = {};
      if (speciesName) finalTaxonomy.species = speciesName;
      if (rawTaxon.rank) finalTaxonomy.rank = rawTaxon.rank;
    }

    // Preserve Wikidata taxon ID
    if (rawTaxon.wikidataId) {
      finalTaxonomy.wikidataId = rawTaxon.wikidataId;
    }

    // Preserve reference information
    if (rawTaxon.reference) {
      finalTaxonomy.reference = rawTaxon.reference;
    }

    finalTaxonomy.dbRef = { $ref: 'lotusesV2', $id: entry._id };
    taxonomies.push(finalTaxonomy);
  }

  return taxonomies;
}
