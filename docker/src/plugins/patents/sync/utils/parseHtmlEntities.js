export function parseHtmlEntities(str) {
  if (typeof str !== 'string') {
    str = JSON.stringify(str);
  }

  // First, handle numeric entities
  str = str.replace(
    /\\u(?<unicode>[\d\w]{4})|&#(?<htmlEntity>[0-9]{1,3});/gi,
    (match, _, __, unicode, htmlEntity) => {
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
  };

  for (const [entity, replacement] of Object.entries(namedEntities)) {
    str = str.split(entity).join(replacement);
  }

  return str;
}
