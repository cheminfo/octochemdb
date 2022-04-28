import { searchTaxonomies } from './searchTaxonomies.js';

export async function getTaxonomiesForCoconuts(entry, taxonomiesCollection) {
  let taxonomiesCoconuts = [];
  if (entry.data?.taxonomies) {
    if (entry.data.taxonomies.length > 1) {
      for (let i = 0; i < entry.data.taxonomies.length; i++) {
        let genus = entry.data.taxonomies[i].species.split(' ');
        if (genus.length > 0) {
          let searchParameter = {
            'taxonomies.genus': genus[0],
          };
          let result = await searchTaxonomies(
            taxonomiesCollection,
            searchParameter,
          );
          if (result.length > 0) {
            let finalTaxonomy = result[0].taxonomies;
            finalTaxonomy.species = entry.data.taxonomies[i].species;
            taxonomiesCoconuts.push(finalTaxonomy);
          }
        } else {
          let finalTaxonomy = entry.data.taxonomies;
          taxonomiesCoconuts.push(finalTaxonomy[0]);
        }
      }
    } else {
      let genus = entry.data.taxonomies[0].species.split(' ');
      if (genus.length > 0) {
        let searchParameter = {
          'taxonomies.genus': genus[0],
        };
        let result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          let finalTaxonomy = result[0].taxonomies;
          finalTaxonomy.species = entry.data.taxonomies[0].species;

          taxonomiesCoconuts.push(finalTaxonomy);
        } else {
          let finalTaxonomy = entry.data.taxonomies;
          taxonomiesCoconuts.push(finalTaxonomy[0]);
        }
      }
    }
  }
  if (taxonomiesCoconuts.length > 0) {
    entry.data.taxonomies = taxonomiesCoconuts;
  }
  return entry;
}
