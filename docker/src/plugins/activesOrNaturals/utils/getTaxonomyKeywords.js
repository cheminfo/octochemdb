/**
 * Extract lowercased keyword tokens from taxonomy rank fields.
 * @param {TaxonomyResult[]} taxonomies
 * @returns {string[]} deduplicated array of taxonomy keywords
 */
export default function getTaxonomyKeywords(taxonomies) {
  const taxonomiesKW = new Set();
  for (let taxonomy of taxonomies) {
    const keywordSuperKingdom = [taxonomy?.superkingdom]
      .join(' ')
      .toLowerCase()
      .split(/\W+/);
    const keywordKingdom = [taxonomy?.kingdom]
      .join(' ')
      .toLowerCase()
      .split(/\W+/);
    const keywordPhylum = [taxonomy?.phylum]
      .join(' ')
      .toLowerCase()
      .split(/\W+/);
    const keywordClass = [taxonomy?.class].join(' ').toLowerCase().split(/\W+/);
    const keywordOrder = [taxonomy?.order].join(' ').toLowerCase().split(/\W+/);
    const keywordFamily = [taxonomy?.family]
      .join(' ')
      .toLowerCase()
      .split(/\W+/);
    const keywordGenus = [taxonomy?.genus].join(' ').toLowerCase().split(/\W+/);
    const keywordSpecies = [taxonomy?.species]
      .join(' ')
      .toLowerCase()
      .split(/\W+/);
    const keywords = [
      ...keywordSuperKingdom,
      ...keywordKingdom,
      ...keywordPhylum,
      ...keywordClass,
      ...keywordOrder,
      ...keywordFamily,
      ...keywordGenus,
      ...keywordSpecies,
    ];

    for (let keyword of keywords) {
      if (keyword !== '') {
        taxonomiesKW.add(keyword);
      }
    }
  }

  return [...taxonomiesKW];
}
