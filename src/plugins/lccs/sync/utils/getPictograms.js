/**
 * Extracts GHS pictograms (type and SVG URL) from a classification entry.
 * @param entry - Pictogram(s) classification entry containing stringwithmarkup markup.
 * @returns An array of pictogram objects, each with `type` and `svgUrl`.
 */
export function getPictograms(entry) {
  let pictograms = [];
  const markup = entry.value.stringwithmarkup.markup;
  if (Array.isArray(markup)) {
    for (let pictogram of markup) {
      pictograms.push({
        type: pictogram.extra,
        svgUrl: pictogram.url,
      });
    }
  } else {
    pictograms.push({
      type: markup.extra,
      svgUrl: markup.url,
    });
  }
  return pictograms;
}
