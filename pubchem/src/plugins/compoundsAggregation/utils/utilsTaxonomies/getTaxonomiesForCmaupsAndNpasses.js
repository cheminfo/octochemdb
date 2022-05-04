import { searchTaxonomies } from '../utilsTaxonomies/searchTaxonomies.js';

export async function getTaxonomiesForCmaupsAndNpasses(
  entry,
  taxonomiesCollection,
) {
  let taxonomiesResults = [];
  if (entry.data?.taxonomies) {
    if (entry.data.taxonomies.length > 0) {
      for (let i = 0; i < entry.data.taxonomies.length; i++) {
        let taxons = entry.data.taxonomies[i];
        let searchParameter;
        let type = {};
        if (taxons.speciesID) {
          searchParameter = {
            _id: Number(taxons.speciesID),
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
          searchParameter = {
            _id: Number(taxons.genusID),
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
          searchParameter = {
            _id: Number(taxons.familyID),
          };
          type.familyID = searchParameter;
        }
        if (taxons.family) {
          searchParameter = {
            'data.family': taxons.family,
          };
          type.family = searchParameter;
        }

        let shouldSearch = true;
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
          finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
          taxonomiesResults.push(finalTaxonomy);
        }
      }
    }
  }
  if (taxonomiesResults.length > 0) {
    entry.data.taxonomies = taxonomiesResults;
  }

  return entry;
}
