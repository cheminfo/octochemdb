import { searchTaxonomies } from './searchTaxonomies.js';

export async function getTaxonomiesForNpAtlases(
  entry,
  taxonomiesCollection,
  synonyms,
) {
  let taxonomiesResults = [];
  if (entry.data?.taxonomies) {
    let taxons = entry.data.taxonomies[0];
    let searchParameter;
    let type = {};
    let oldIDs = Object.keys(synonyms);

    if (taxons.species) {
      searchParameter = {
        'data.species': taxons.species,
      };
      type.species = searchParameter;
    }
    if (taxons.genusID && taxons.genusID !== null) {
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
