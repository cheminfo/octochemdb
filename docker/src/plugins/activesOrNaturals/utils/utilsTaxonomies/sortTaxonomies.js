/**
 * @description sort taxonomies by superKingdom, kingdom, phylum, class, order, family, genus, species
 * @param {Array} taxonomies - array of objects
 *
 */
export function sortTaxonomies(taxonomies) {
  const fields = [
    'superKingdom',
    'kingdom',
    'phylum',
    'class',
    'order',
    'family',
    'genus',
    'species',
  ];
  if (taxonomies?.length === 1) return taxonomies;
  const sortedTaxonomies = taxonomies.sort((a, b) => {
    for (const field of fields) {
      if (a[field] !== b[field]) {
        return a[field].localeCompare(b[field]);
      }
    }
    return 0;
  });
  return sortedTaxonomies;
}
