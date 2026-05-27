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
