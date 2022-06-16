import { searchTaxonomies } from './searchTaxonomies.js';
/**
 * @description get standardized taxonomies for NpAtlases
 * @param {*} entry The data from aggregation process
 * @param {*} taxonomiesCollection The taxonomies collection
 * @param {*} oldToNewTaxIDs The newId to oldId map
 * @returns {Promise<Array>} The standardized taxonomies
 */
export async function getTaxonomiesForNpAtlases(
  entry,
  taxonomiesCollection,
  oldToNewTaxIDs,
) {
  let taxonomiesResults = [];
  if (entry.data?.taxonomies) {
    // Get taxonomies from the entry
    let taxons = entry.data.taxonomies[0];
    let searchParameter;
    let type = {};
    let oldIDs = Object.keys(oldToNewTaxIDs);
    // Get the type of the taxonomy (species level, genus level, etc.)
    if (taxons.species) {
      searchParameter = {
        'data.species': taxons.species,
      };
      type.species = searchParameter;
    }
    if (taxons.genusID && taxons.genusID !== null) {
      let idToUse = Number(taxons.genusID);
      // If the ID is not in the taxonomies collection, check if it is in the oldToNewTaxIDs object
      // If it is, use the new ID
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

    if (taxons.family) {
      searchParameter = {
        'data.family': taxons.family,
      };
      type.family = searchParameter;
    }
    if (taxons.class) {
      searchParameter = {
        'data.class': taxons.class,
      };
      type.class = searchParameter;
    }
    if (taxons.phylum) {
      searchParameter = {
        'data.phylum': taxons.phylum,
      };
      type.phylum = searchParameter;
    }
    // until shouldSearch is true, we keep searching for the taxonomy
    // using the different search parameters types
    let shouldSearch = true;

    if (type.species && shouldSearch) {
      let result = await searchTaxonomies(taxonomiesCollection, type.species);
      if (result.length > 0) {
        let finalTaxonomy = result[0].data;

        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
        taxonomiesResults.push(finalTaxonomy);
        shouldSearch = false;
      }
    }
    if (type.genusID && shouldSearch) {
      let result = await searchTaxonomies(taxonomiesCollection, type.genusID);
      if (result.length > 0) {
        let finalTaxonomy = result[0].data;
        if (taxons.species) {
          finalTaxonomy.species = taxons.species;
        }
        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
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
        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
        taxonomiesResults.push(finalTaxonomy);
        shouldSearch = false;
      }
    }

    if (type.family && shouldSearch) {
      let result = await searchTaxonomies(taxonomiesCollection, type.family);
      if (result.length > 0) {
        let finalTaxonomy = result[0].data;
        if (taxons.genus) {
          finalTaxonomy.genus = taxons.genus;
        }
        if (taxons.species) {
          finalTaxonomy.species = taxons.species;
        }
        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
        taxonomiesResults.push(finalTaxonomy);
        shouldSearch = false;
      }
    }

    if (type.class && shouldSearch) {
      let result = await searchTaxonomies(taxonomiesCollection, type.class);
      if (result.length > 0) {
        let finalTaxonomy = result[0].data;
        if (taxons.family) {
          finalTaxonomy.family = taxons.family;
        }
        if (taxons.genus) {
          finalTaxonomy.genus = taxons.genus;
        }
        if (taxons.species) {
          finalTaxonomy.species = taxons.species;
        }
        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
        taxonomiesResults.push(finalTaxonomy);
        shouldSearch = false;
      }
    }
    if (type.phylum && shouldSearch) {
      let result = await searchTaxonomies(taxonomiesCollection, type.phylum);
      if (result.length > 0) {
        let finalTaxonomy = result[0].data;

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
        finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
        taxonomiesResults.push(finalTaxonomy);
        shouldSearch = false;
      }
    }
    // if shouldSearch is true, we didn't find any taxonomy, so we keep the original taxonomy in standard format
    if (shouldSearch) {
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
      finalTaxonomy.dbRef = { $ref: 'npAtlases', $id: entry._id };
      taxonomiesResults.push(finalTaxonomy);
    }
  }

  return taxonomiesResults;
}
