/**
 * Decodes HTML entities and Unicode escape sequences in a string.
 *
 * Handles:
 * - Numeric HTML entities (`&#123;`)
 * - JavaScript-style Unicode escapes (`\u0041`)
 * - A fixed set of named HTML entities (`&amp;`, `&nbsp;`, `&copy;`, etc.)
 *
 * If the input is not a string it is first serialised with `JSON.stringify`.
 *
 * @param {string} str - The raw string that may contain HTML entities.
 * @returns {string} The decoded string.
 */
export function parseHtmlEntities(str) {
  if (typeof str !== 'string') {
    str = JSON.stringify(str);
  }

  // Decode numeric HTML entities (&#123;) and Unicode escapes (\u0041).
  str = str.replace(
    /\\u(?<unicode>[\d\w]{4})|&#(?<htmlEntity>[0-9]{1,3});/gi,
    /**
     * @param {string} match
     * @param {string | undefined} unicode
     * @param {string | undefined} htmlEntity
     */
    (match, unicode, htmlEntity) => {
      if (unicode) {
        return String.fromCharCode(parseInt(unicode, 16));
      } else if (htmlEntity) {
        return String.fromCharCode(parseInt(htmlEntity, 10));
      }
      return match;
    },
  );

  const namedEntities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&cent;': '¢',
    '&pound;': '£',
    '&yen;': '¥',
    '&euro;': '€',
    '&copy;': '©',
    '&reg;': '®',
    '&sect;': '§',
    '&laquo;': '«',
    '&raquo;': '»',
    '&bull;': '•',
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': '‘',
    '&rsquo;': '’',
    '&ldquo;': '“',
    '&rdquo;': '”',
    '&trade;': '™',
    '&times;': '×',
    '&divide;': '÷',
    '&oslash;': 'ø',
    '&Oslash;': 'Ø',
    '&plusmn;': '±',
    '&micro;': 'µ',
    '&deg;': '°',
  };

  for (const [entity, replacement] of Object.entries(namedEntities)) {
    str = str.split(entity).join(replacement);
  }

  return str;
}
