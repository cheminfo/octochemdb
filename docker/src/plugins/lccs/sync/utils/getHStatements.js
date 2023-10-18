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
