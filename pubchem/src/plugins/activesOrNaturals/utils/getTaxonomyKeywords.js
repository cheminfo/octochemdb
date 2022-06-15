/**
 * @description Get the taxonomy keywords for a array of taxonomies
 * @param {*} taxonomies Array of Objects with taxonomies
 * @returns {Array} Array of taxonomy keywords
 */
export default function getTaxonomyKeywords(taxonomies) {
  const taxonomiesKW = new Set();
  for (let taxonomy of taxonomies) {
    const keywords = [
      taxonomy.superkingdom,
      taxonomy.kingdom,
      taxonomy.phylum,
      taxonomy.class,
      taxonomy.order,
      taxonomy.family,
      taxonomy.species,
      taxonomy.genus,
      taxonomies.species,
    ]
      .join(' ')
      .toLowerCase();

    for (let keyword of keywords) {
      if (keyword !== '') {
        taxonomiesKW.add(keyword);
      }
    }
  }

  return [...taxonomiesKW];
}
