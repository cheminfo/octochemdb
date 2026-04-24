import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

/**
 * Resolves enriched taxonomy data for a LOTUS V2 entry by looking up each
 * taxon in the `taxonomies` MongoDB collection (NCBI taxonomy).
 *
 * The lookup strategy mirrors the old lotuses plugin (`getTaxonomiesForLotuses`):
 *  1. If the taxon has an NCBI ID, look up directly by `_id`.
 *  2. If not found, try by species name (`data.species`).
 *  3. If still not found, try by genus (`data.genus`).
 *  4. If still not found, try by family (`data.family`).
 *  5. When found, the full taxonomy tree (kingdom, phylum, class, family,
 *     genus, species) is merged from the NCBI record.
 *  6. When not found, keeps the raw Wikidata taxonomy fields.
 *
 * Every returned taxonomy object carries a `dbRef` back-link to the owning
 * `lotusesV2` document.
 *
 * @param {object} entry - A LOTUS V2 entry with optional raw taxonomies.
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

    // 1. Try NCBI ID lookup (most reliable)
    if (rawTaxon.ncbiId) {
      const result = await searchTaxonomies(taxonomiesCollection, {
        _id: rawTaxon.ncbiId,
      });
      if (result.length > 0) {
        finalTaxonomy = { ...result[0].data };
        if (speciesName) finalTaxonomy.species = speciesName;
      }
    }

    // 2. Try species name lookup
    if (!finalTaxonomy && speciesName) {
      const result = await searchTaxonomies(taxonomiesCollection, {
        'data.species': speciesName,
      });
      if (result.length > 0) {
        finalTaxonomy = { ...result[0].data };
      }
    }

    // 3. Try genus lookup
    if (!finalTaxonomy && genus) {
      const result = await searchTaxonomies(taxonomiesCollection, {
        'data.genus': genus,
      });
      if (result.length > 0) {
        finalTaxonomy = { ...result[0].data };
        delete finalTaxonomy.species;
        if (speciesName) finalTaxonomy.species = speciesName;
      }
    }

    // 4. Fallback: keep raw Wikidata data
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
