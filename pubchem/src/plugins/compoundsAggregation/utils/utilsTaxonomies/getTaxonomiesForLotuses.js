import { searchTaxonomies } from './searchTaxonomies.js';
import Debug from '../../../../utils/Debug.js';
const debug = Debug('lotuses');
export async function getTaxonomiesForLotuses(
  entry,
  taxonomiesCollection,
  synonims,
) {
  let taxonomiesLotuses = [];
  if (entry.data?.taxonomies) {
    let taxonomiesSources = Object.keys(entry.data.taxonomies);
    let sourceToBeUsed;
    let newIDs = Object.keys(synonims);
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

          finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
          taxonomiesLotuses.push(finalTaxonomy);
          shoudlImport = false;
        }
        if (result.length === 0 && newIDs.includes(taxons.organismID)) {
          let searchParameter = {
            _id: Number(newIDs[taxons.organismID]),
          };
          let result = await searchTaxonomies(
            taxonomiesCollection,
            searchParameter,
          );
          if (result.length > 0) {
            let finalTaxonomy = result[0].data;

            finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
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

          finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
          taxonomiesLotuses.push(finalTaxonomy);
          shoudlImport = false;
        }
      }
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
          finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
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
          finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
          taxonomiesLotuses.push(finalTaxonomy);
          shoudlImport = false;
        }
      }
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
        finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
        taxonomiesLotuses.push(finalTaxonomy);
        shoudlImport = false;
      }
    }
  }
  if (taxonomiesLotuses.length > 0) {
    entry.data.taxonomies = taxonomiesLotuses;
  }
  return entry;
}
