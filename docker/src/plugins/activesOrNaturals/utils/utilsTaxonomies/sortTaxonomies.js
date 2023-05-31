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
      // if field is undefined write it as empty string to avoid errors
      if (a[field] === undefined) a[field] = '';
      if (b[field] === undefined) b[field] = '';
      if (a[field] !== b[field]) {
        return a[field].localeCompare(b[field]);
      }
    }
    return 0;
  });
  // remove all fields which are empty strings
  sortedTaxonomies.forEach((taxonomy) => {
    for (const field of fields) {
      if (taxonomy[field] === '') delete taxonomy[field];
    }
  });
  return sortedTaxonomies;
}
