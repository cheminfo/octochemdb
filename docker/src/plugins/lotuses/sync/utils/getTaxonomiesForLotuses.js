import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

/**
 * Resolves and standardises taxonomy data for a single LOTUS entry by
 * searching the `taxonomies` MongoDB collection.
 *
 * The function preferentially resolves from the `"ncbi"` source using the
 * organism ID, then falls back to species-name lookup. For non-NCBI sources
 * it tries genus, then family. When no match is found the original parsed
 * taxonomy fields are kept in a normalised format.
 *
 * Every returned taxonomy object carries a `dbRef` back-link to the owning
 * `lotuses` document.
 *
 * @param {LotusEntry} entry - The LOTUS entry whose taxonomies are being resolved.
 * @param {TaxonomyCollection} taxonomiesCollection - The `taxonomies` MongoDB collection.
 * @param {DeprecatedTaxIdMap} oldToNewTaxIDs - Map of deprecated taxonomy IDs to
 *   their current replacement IDs.
 * @returns {Promise<LotusResolvedTaxonomy[]>} Resolved taxonomy records.
 */
export async function getTaxonomiesForLotuses(
  entry,
  taxonomiesCollection,
  oldToNewTaxIDs,
) {
  /** @type {LotusResolvedTaxonomy[]} */
  const taxonomiesLotuses = [];
  if (entry.data?.taxonomies) {
    /** @type {LotusRawTaxonomies} */
    const rawTaxonomies = /** @type {LotusRawTaxonomies} */ (entry.data.taxonomies);
    const taxonomiesSources = Object.keys(rawTaxonomies);
    let sourceToBeUsed;
    const oldIDs = Object.keys(oldToNewTaxIDs);
    // Lotuses taxonomies came sometimes from different sources, so we will preferentially use the source that comes from NCBI
    // we use first the _id of the taxonomy, if nothing is found we try to retrieve the taxonomy using the species name
    if (taxonomiesSources.includes('ncbi')) {
      sourceToBeUsed = 'ncbi';
    } else {
      sourceToBeUsed = taxonomiesSources[0].toString();
    }
    for (let i = 0; i < (rawTaxonomies[sourceToBeUsed] ?? []).length; i++) {
      const taxons = /** @type {LotusParsedTaxonomy} */ (rawTaxonomies[sourceToBeUsed]?.[i]);
      let shouldImport = true;
      if (shouldImport && taxons?.organismID && sourceToBeUsed === 'ncbi') {
        const searchParameter = {
          _id: Number(taxons.organismID),
        };
        const result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          const finalTaxonomy = result[0].data;

          finalTaxonomy.dbRef = { $ref: 'lotuses', $id: entry._id };
          taxonomiesLotuses.push(finalTaxonomy);
          shouldImport = false;
        }
        if (result.length === 0 && oldIDs.includes(taxons.organismID)) {
          const searchParameter = {
            _id: Number(oldToNewTaxIDs[taxons.organismID]),
          };
          const result = await searchTaxonomies(
            taxonomiesCollection,
            searchParameter,
          );
          if (result.length > 0) {
            const finalTaxonomy = result[0].data;

            finalTaxonomy.dbRef = { $ref: 'lotuses', $id: entry._id };
            taxonomiesLotuses.push(finalTaxonomy);
            shouldImport = false;
          }
        }
      }
      if (shouldImport && taxons?.species && sourceToBeUsed === 'ncbi') {
        const searchParameter = {
          'data.species': taxons.species,
        };
        const result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          const finalTaxonomy = result[0].data;

          finalTaxonomy.dbRef = { $ref: 'lotuses', $id: entry._id };
          taxonomiesLotuses.push(finalTaxonomy);
          shouldImport = false;
        }
      }
      // If the source is not NCBI, we will use the first other source
      // we try to retrieve the taxonomy using the genus and the family
      if (shouldImport && sourceToBeUsed !== 'ncbi' && taxons.genus) {
        const searchParameter = {
          'data.genus': taxons.genus,
        };
        const result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          const finalTaxonomy = result[0].data;
          delete finalTaxonomy.species;
          if (taxons.species) {
            finalTaxonomy.species = taxons.species;
          }
          finalTaxonomy.dbRef = { $ref: 'lotuses', $id: entry._id };
          taxonomiesLotuses.push(finalTaxonomy);
          shouldImport = false;
        }
      }
      if (shouldImport && sourceToBeUsed !== 'ncbi' && taxons.family) {
        const searchParameter = {
          'data.family': taxons.family,
        };
        const result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          const finalTaxonomy = result[0].data;
          if (taxons.genus) {
            finalTaxonomy.genus = taxons.genus;
          }
          if (taxons.species) {
            finalTaxonomy.species = taxons.species;
          }
          finalTaxonomy.dbRef = { $ref: 'lotuses', $id: entry._id };
          taxonomiesLotuses.push(finalTaxonomy);
          shouldImport = false;
        }
      }
      // if we failed to find a taxonomy, we keep the original one in a standardized format
      if (shouldImport) {
        /** @type {LotusResolvedTaxonomy} */
        const finalTaxonomy = {};
        if (taxons.kingdom) {
          finalTaxonomy.kingdom = taxons.kingdom;
        }
        if (taxons.phylum) {
          finalTaxonomy.phylum = taxons.phylum;
        }
        if (taxons.class) {
          finalTaxonomy.class = taxons.class;
        }
        if (taxons.family) {
          finalTaxonomy.family = taxons.family;
        }
        if (taxons.genus) {
          finalTaxonomy.genus = taxons.genus;
        }
        if (taxons.species) {
          finalTaxonomy.species = taxons.species;
        }
        finalTaxonomy.dbRef = { $ref: 'lotuses', $id: entry._id };
        taxonomiesLotuses.push(finalTaxonomy);
      }
    }
  }

  return taxonomiesLotuses;
}
