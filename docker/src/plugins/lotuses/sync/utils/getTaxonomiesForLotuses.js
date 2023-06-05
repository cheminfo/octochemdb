import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

/**
 * @description get standardized taxonomies for Lotuses
 * @param {*} entry The data from aggregation process
 * @param {*} taxonomiesCollection The taxonomies collection
 * @param {*} oldToNewTaxIDs The newId to oldId map
 * @returns {Promise<Array>} The standardized taxonomies
 */
export async function getTaxonomiesForLotuses(
  entry,
  taxonomiesCollection,
  oldToNewTaxIDs,
) {
  let taxonomiesLotuses = [];
  if (entry.data?.taxonomies) {
    let taxonomiesSources = Object.keys(entry.data.taxonomies);
    let sourceToBeUsed;
    let oldIDs = Object.keys(oldToNewTaxIDs);
    // Lotuses taxonomies came sometimes from different sources, so we will preferentially use the source that comes from NCBI
    // we use first the _id of the taxonomy, if nothing is found we try to retrieve the taxonomy using the species name
    if (taxonomiesSources.includes('ncbi')) {
      sourceToBeUsed = 'ncbi';
    } else {
      sourceToBeUsed = taxonomiesSources[0].toString();
    }
    for (let i = 0; i < entry.data.taxonomies[sourceToBeUsed].length; i++) {
      let taxons = entry.data.taxonomies[sourceToBeUsed][i];
      let shoudlImport = true;
      if (shoudlImport && taxons?.organismID && sourceToBeUsed === 'ncbi') {
        let searchParameter = {
          _id: Number(taxons.organismID),
        };
        let result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          let finalTaxonomy = result[0].data;

          finalTaxonomy.dbRef = { $ref: 'lotuses', $id: entry._id };
          taxonomiesLotuses.push(finalTaxonomy);
          shoudlImport = false;
        }
        if (result.length === 0 && oldIDs.includes(taxons.organismID)) {
          let searchParameter = {
            _id: Number(oldToNewTaxIDs[taxons.organismID]),
          };
          let result = await searchTaxonomies(
            taxonomiesCollection,
            searchParameter,
          );
          if (result.length > 0) {
            let finalTaxonomy = result[0].data;

            finalTaxonomy.dbRef = { $ref: 'lotuses', $id: entry._id };
            taxonomiesLotuses.push(finalTaxonomy);
            shoudlImport = false;
          }
        }
      }
      if (shoudlImport && taxons?.species && sourceToBeUsed === 'ncbi') {
        let searchParameter = {
          'data.species': taxons.species,
        };
        let result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          let finalTaxonomy = result[0].data;

          finalTaxonomy.dbRef = { $ref: 'lotuses', $id: entry._id };
          taxonomiesLotuses.push(finalTaxonomy);
          shoudlImport = false;
        }
      }
      // If the source is not NCBI, we will use the first other source
      // we try to retrieve the taxonomy using the genus and the family
      if (shoudlImport && sourceToBeUsed !== 'ncbi' && taxons.genus) {
        let searchParameter = {
          'data.genus': taxons.genus,
        };
        let result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          let finalTaxonomy = result[0].data;
          delete finalTaxonomy.species;
          if (taxons.species) {
            finalTaxonomy.species = taxons.species;
          }
          finalTaxonomy.dbRef = { $ref: 'lotuses', $id: entry._id };
          taxonomiesLotuses.push(finalTaxonomy);
          shoudlImport = false;
        }
      }
      if (shoudlImport && sourceToBeUsed !== 'ncbi' && taxons.family) {
        let searchParameter = {
          'data.family': taxons.family,
        };
        let result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          let finalTaxonomy = result[0].data;
          if (taxons.genus) {
            finalTaxonomy.genus = taxons.genus;
          }
          if (taxons.species) {
            finalTaxonomy.species = taxons.species;
          }
          finalTaxonomy.dbRef = { $ref: 'lotuses', $id: entry._id };
          taxonomiesLotuses.push(finalTaxonomy);
          shoudlImport = false;
        }
      }
      // if we failed to find a taxonomy, we keep the original one in a standardized format
      if (shoudlImport) {
        let finalTaxonomy = {};
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
        shoudlImport = false;
      }
    }
  }

  return taxonomiesLotuses;
}
