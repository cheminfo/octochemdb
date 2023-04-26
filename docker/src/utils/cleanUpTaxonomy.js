/**
 * @description This function is used to get the hierarchy of the taxonomy
 * @param {Object} taxonomy - The taxonomy object
 * @returns {Object} The hierarchy of the taxonomy
 */
export function cleanUpTaxonomy(taxonomy) {
  let result = {};
  if (taxonomy?.superkingdom) {
    result.superkingdom = taxonomy.superkingdom;
  }
  if (taxonomy?.kingdom) {
    result.kingdom = taxonomy.kingdom;
  }
  if (taxonomy?.phylum) {
    result.phylum = taxonomy.phylum;
  }
  if (taxonomy?.class) {
    result.class = taxonomy.class;
  }
  if (taxonomy?.order) {
    result.order = taxonomy.order;
  }
  if (taxonomy?.family) {
    result.family = taxonomy.family;
  }
  if (taxonomy?.genus) {
    result.genus = taxonomy.genus;
  }
  if (taxonomy?.species) {
    result.species = taxonomy.species;
  }
  return result;
}
