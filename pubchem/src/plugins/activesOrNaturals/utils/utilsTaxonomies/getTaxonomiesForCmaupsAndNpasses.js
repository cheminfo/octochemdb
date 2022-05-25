import { searchTaxonomies } from './searchTaxonomies.js';

export async function getTaxonomiesForCmaupsAndNpasses(
  entry,
  taxonomiesCollection,
  synonyms,
  collectionName,
) {
  let oldIDs = Object.keys(synonyms);
  let taxonomiesResults = [];
  if (entry.data?.taxonomies) {
    if (entry.data.taxonomies.length > 0) {
      for (let i = 0; i < entry.data.taxonomies.length; i++) {
        let taxons = entry.data.taxonomies[i];
        let searchParameter;
        let type = {};
        // Define the search parameters that could be use (id, species name, genus, ...)
        if (taxons.speciesID) {
          let idToUse = Number(taxons.speciesID);
          if (oldIDs.includes(taxons.speciesID)) {
            idToUse = Number(synonyms[taxons.speciesID]);
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
            idToUse = Number(synonyms[taxons.genusID]);
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
            idToUse = Number(synonyms[taxons.familyID]);
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
        // Try search parameter by order of preference (species id , species name, ...) till you get a result
        let shouldSearch = true; // if there is a results, it became false
        if (type.speciesID && shouldSearch) {
          let result = await searchTaxonomies(
            taxonomiesCollection,
            type.speciesID,
          );
          if (result.length > 0) {
            let finalTaxonomy = result[0].data;

            finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
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

            finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
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
            finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
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
            finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
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
            finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
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
            finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
            taxonomiesResults.push(finalTaxonomy);
            shouldSearch = false;
          }
        }
        // If no results were found, keep taxonomy informations available from orginal collection
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
