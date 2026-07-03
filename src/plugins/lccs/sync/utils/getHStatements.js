/**
 * Extracts GHS hazard (H) codes from a classification entry and maps each to its description.
 * @param entry - GHS Hazard Statements classification entry containing the stringwithmarkup value(s).
 * @param hCodes - Lookup table of known H codes to their details.
 * @param hCodesDescription - Accumulator object of H code descriptions to populate.
 * @returns The updated hCodesDescription object with an entry per hazard code found.
 */
export function getHStatements(entry, hCodes, hCodesDescription) {
  const stringMarkup = entry.value.stringwithmarkup;
  if (Array.isArray(stringMarkup)) {
    for (let markup of stringMarkup) {
      const hcode = markup.string.split(/:(?=\s|$)/)[0];
      if (hCodes[hcode] === undefined) {
        hCodesDescription[hcode] = markup.string.split(/:(?=\s|$)/)[1];
      } else {
        hCodesDescription[hcode] = hCodes[hcode];
      }
    }
  } else {
    const hcode = stringMarkup.string.split(/:(?=\s|$)/)[0];
    hCodesDescription[hcode] = hCodes[hcode];
  }
  return hCodesDescription;
}
