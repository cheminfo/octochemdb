/**
 * Extract lowercased keyword tokens from molecule titles.
 * @param molecules
 * @returns deduplicated array of title keywords
 */
export function getTitlesKeywords(molecules) {
  const titlesKw = new Set();
  for (let molecule of molecules) {
    if (molecule.titles?.length > 0) {
      for (let title of molecule.titles
        .join(' ')
        .toLowerCase()
        .split(/ *(?:, |[;\t\n\r\s]+) */)) {
        if (title !== '') {
          titlesKw.add(title);
        }
      }
    }
  }

  return [...titlesKw];
}
