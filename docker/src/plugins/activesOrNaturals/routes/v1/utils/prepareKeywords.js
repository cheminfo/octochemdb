import pkg from 'lodash';

const { escapeRegExp } = pkg;
export function prepareKeywords(string, options = {}) {
  const { escapeRegExpression = false } = options;
  if (!string) return [];
  return string
    .toLowerCase()
    .split(/ *(?:, |[;\t\n\r\s]+) */)
    .filter((entry) => entry)
    .map((entry) => {
      if (escapeRegExpression) {
        entry = escapeRegExp(entry);
      }
      return entry;
    });
}
