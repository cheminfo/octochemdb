import { isIgnoreKeyword } from '../../../utils/isIgnoreKeyword.js';

export function getTaxonomyKeywords(taxonomies) {
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
    ]
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter((k) => k);
    for (let keyword of keywords) {
      if (!isIgnoreKeyword(keyword) && isNaN(Number(keyword))) {
        taxonomiesKW.add(keyword);
      }
    }
  }

  return [...taxonomiesKW];
}
