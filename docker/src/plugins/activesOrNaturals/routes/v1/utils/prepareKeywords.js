export function prepareKeywords(string, options = {}) {
  const { escapeRegExp = false, startsWith = false } = options;
  return string
    .toLowerCase()
    .split(/ *(?:, |[;\t\n\r\s]+) */)
    .filter((entry) => entry)
    .map((entry) => {
      if (escapeRegExp) {
        entry = escapeRegExp(entry);
      }
      if (startsWith) {
        entry = `^${entry}`;
      }
      return entry;
    });
}
