import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';
/**
 * @description get standardized taxonomies for Coconuts
 * @param {*} entry The data from aggregation process
 * @param {*} taxonomiesCollection The taxonomies collection
 * @returns {Promise<Array>} The standardized taxonomies
 */
export async function getTaxonomiesForCoconuts(entry, taxonomiesCollection) {
  let taxonomiesCoconuts = [];
  if (entry.data?.taxonomies) {
    if (entry.data.taxonomies.length > 1) {
      for (let i = 0; i < entry.data.taxonomies.length; i++) {
        // coconuts taxonomies are most of times at species level while the rest are at superkingdom level
        // since species name is composed of the genus and species name, we need to check if the genus is in the taxonomies collection
        let genus = entry.data.taxonomies[i].species.split(' ');
        if (genus.length > 0) {
          let searchParameter = {
            'data.genus': genus[0],
          };
          let result = await searchTaxonomies(
            taxonomiesCollection,
            searchParameter,
          );
          let finalTaxonomy;
          if (result.length > 0) {
            finalTaxonomy = result[0].data;
            finalTaxonomy.species = entry.data.taxonomies[i].species;
            finalTaxonomy.dbRef = { $ref: 'coconuts', $id: entry._id };
            taxonomiesCoconuts.push(finalTaxonomy);
          } else {
            finalTaxonomy = entry.data.taxonomies[i];
            finalTaxonomy.dbRef = { $ref: 'coconuts', $id: entry._id };
            taxonomiesCoconuts.push(finalTaxonomy);
          }
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
          finalTaxonomy.dbRef = { $ref: 'coconuts', $id: entry._id };
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
