/**
 * @description Get the compound titles keywords
 * @param {Array<Object>} molecules Array of Objects with compounds information
 * @returns {Array} Array titles
 */
export function getTitlesKeywords(molecules) {
  const titlesKw = new Set();
  for (let molecule of molecules) {
    if (molecule.titles?.length > 0) {
      for (let title of molecule.titles) {
        if (title !== '') {
          titlesKw.add(title);
        }
      }
    }
  }

  return [...titlesKw];
}
