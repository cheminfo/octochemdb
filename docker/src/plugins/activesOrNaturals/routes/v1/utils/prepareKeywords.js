/**
 * Split a keyword string on common delimiters and return lowercased tokens.
 * @param {string | undefined} string - raw keyword string from the query
 * @returns {string[]} array of lowercased keyword tokens
 */
export function prepareKeywords(string) {
  if (!string) return [];
  return string
    .toLowerCase()
    .split(/ *(?:, |[;\t\n\r\s]+) */)
    .filter((entry) => entry);
}
