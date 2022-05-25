import { searchTaxonomies } from './searchTaxonomies.js';

export async function getTaxonomiesForCoconuts(entry, taxonomiesCollection) {
  let taxonomiesCoconuts = [];
  if (entry.data?.taxonomies) {
    if (entry.data.taxonomies.length > 1) {
      for (let i = 0; i < entry.data.taxonomies.length; i++) {
        let genus = entry.data.taxonomies[i].species.split(' ');
        if (genus.length > 0) {
          let searchParameter = {
            'data.genus': genus[0],
          };
          let result = await searchTaxonomies(
            taxonomiesCollection,
            searchParameter,
          );
          if (result.length > 0) {
            let finalTaxonomy = result[0].data;
            finalTaxonomy.species = entry.data.taxonomies[i].species;
            finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
            taxonomiesCoconuts.push(finalTaxonomy);
          }
        } else {
          let finalTaxonomy = entry.data.taxonomies[i];
          finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
          taxonomiesCoconuts.push(finalTaxonomy[0]);
        }
      }
    } else {
      let genus = entry.data.taxonomies[0].species.split(' ');
      if (genus.length > 0) {
        let searchParameter = {
          'data.genus': genus[0],
        };
        let result = await searchTaxonomies(
          taxonomiesCollection,
          searchParameter,
        );
        if (result.length > 0) {
          let finalTaxonomy = result[0].data;
          finalTaxonomy.species = entry.data.taxonomies[0].species;
          finalTaxonomy.dbRef = { $ref: entry.collection, $id: entry._id };
          taxonomiesCoconuts.push(finalTaxonomy);
        }
      } else {
        let finalTaxonomy = entry.data.taxonomies[0];
        finalTaxonomy.dbRef = { $ref: 'coconuts', $id: entry._id };
        taxonomiesCoconuts.push(finalTaxonomy[0]);
      }
    }
  }

  return taxonomiesCoconuts;
}
