import { searchTaxonomies } from './searchTaxonomies.js';
/**
 * @description get standardized taxonomies for Cmaups and Npasses
 * @param {*} entry The data from aggregation process
 * @param {*} taxonomiesCollection The taxonomies collection
 * @param {*} oldToNewTaxIDs The newId to oldId map
 * @param {*} collectionName The name of the collection
 * @returns {Promise} The standardized taxonomies
 */
export async function getTaxonomiesForCmaupsAndNpasses(
  entry,
  taxonomiesCollection,
  oldToNewTaxIDs,
  collectionName,
) {
  let oldIDs = Object.keys(oldToNewTaxIDs);
  let taxonomiesResults = [];
  if (entry.data?.taxonomies) {
    if (entry.data.taxonomies.length > 0) {
      for (let i = 0; i < entry.data.taxonomies.length; i++) {
        let taxons = entry.data.taxonomies[i];
        let searchParameter;
        let type = {};
        // Get the type of the taxonomy (species level, genus level, etc.) to use in the search
        if (taxons.speciesID) {
          let idToUse = Number(taxons.speciesID);
          if (oldIDs.includes(taxons.speciesID)) {
            idToUse = Number(oldToNewTaxIDs[taxons.speciesID]);
          }
          searchParameter = {
            _id: idToUse,
          };
          type.speciesID = searchParameter;
        }
        if (taxons.species) {
          searchParameter = {
            'data.species': taxons.species,
          };
          type.species = searchParameter;
        }
        if (taxons.genusID) {
          let idToUse = Number(taxons.genusID);
          if (oldIDs.includes(taxons.genusID)) {
            idToUse = Number(oldToNewTaxIDs[taxons.genusID]);
          }
          searchParameter = {
            _id: idToUse,
          };
          type.genusID = searchParameter;
        }

        if (taxons.genus) {
          searchParameter = {
            'data.genus': taxons.genusID,
          };
          type.genus = searchParameter;
        }
        if (taxons.familyID) {
          let idToUse = Number(taxons.familyID);
          if (oldIDs.includes(taxons.familyID)) {
            idToUse = Number(oldToNewTaxIDs[taxons.familyID]);
          }
          searchParameter = {
            _id: idToUse,
          };
          type.familyID = searchParameter;
        }
        if (taxons.family) {
          searchParameter = {
            'data.family': taxons.family,
          };
          type.family = searchParameter;
        }
        // until shouldSearch is true, we keep searching for the taxonomy using the different search parameters types
        let shouldSearch = true;
        if (type.speciesID && shouldSearch) {
          let result = await searchTaxonomies(
            taxonomiesCollection,
            type.speciesID,
          );
          if (result.length > 0) {
            let finalTaxonomy = result[0].data;

            finalTaxonomy.dbRef = { $ref: collectionName, $id: entry._id };
            taxonomiesResults.push(finalTaxonomy);
            shouldSearch = false;
          }
        }

        if (type.species && shouldSearch) {
          let result = await searchTaxonomies(
            taxonomiesCollection,
            type.species,
          );
          if (result.length > 0) {
            let finalTaxonomy = result[0].data;

            finalTaxonomy.dbRef = { $ref: collectionName, $id: entry._id };
            taxonomiesResults.push(finalTaxonomy);
            shouldSearch = false;
          }
        }
        if (type.genusID && shouldSearch) {
          let result = await searchTaxonomies(
            taxonomiesCollection,
            type.genusID,
          );
          if (result.length > 0) {
            let finalTaxonomy = result[0].data;

            if (taxons.species) {
              finalTaxonomy.species = taxons.species;
            }
            finalTaxonomy.dbRef = { $ref: collectionName, $id: entry._id };
            taxonomiesResults.push(finalTaxonomy);
            shouldSearch = false;
          }
        }

        if (type.genus && shouldSearch) {
          let result = await searchTaxonomies(taxonomiesCollection, type.genus);
          if (result.length > 0) {
            let finalTaxonomy = result[0].data;
            if (taxons.species) {
              finalTaxonomy.species = taxons.species;
            }
            finalTaxonomy.dbRef = { $ref: collectionName, $id: entry._id };
            taxonomiesResults.push(finalTaxonomy);
            shouldSearch = false;
          }
        }

        if (type.familyID && shouldSearch) {
          let result = await searchTaxonomies(
            taxonomiesCollection,
            type.familyID,
          );
          if (result.length > 0) {
            let finalTaxonomy = result[0].data;
            if (taxons.genus) {
              finalTaxonomy.genus = taxons.genus;
            }
            if (taxons.species) {
              finalTaxonomy.species = taxons.species;
            }
            finalTaxonomy.dbRef = { $ref: collectionName, $id: entry._id };
            taxonomiesResults.push(finalTaxonomy);
            shouldSearch = false;
          }
        }
        if (type.family && shouldSearch) {
          let result = await searchTaxonomies(
            taxonomiesCollection,
            type.family,
          );
          if (result.length > 0) {
            let finalTaxonomy = result[0].data;

            if (taxons.genus) {
              finalTaxonomy.genus = taxons.genus;
            }
            if (taxons.species) {
              finalTaxonomy.species = taxons.species;
            }
            finalTaxonomy.dbRef = { $ref: collectionName, $id: entry._id };
            taxonomiesResults.push(finalTaxonomy);
            shouldSearch = false;
          }
        }
        // If we didn't find any taxonomy, we keep the original taxonomy in a standardized format
        if (shouldSearch) {
          let finalTaxonomy = {};
          if (taxons.kingdom) {
            finalTaxonomy.kingdom = taxons.kingdom;
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
          finalTaxonomy.dbRef = { $ref: collectionName, $id: entry._id };
          taxonomiesResults.push(finalTaxonomy);
        }
      }
    }
  }

  return taxonomiesResults;
}
