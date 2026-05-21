export function getPStatements(entry) {
  const statements = entry.value.stringwithmarkup;
  let codes = {};
  for (let precautionaryStatement of statements) {
    if (precautionaryStatement.markup !== undefined) {
      continue;
    }
    let code = precautionaryStatement.string.split(/\s*,\s*(?:and)?\s*/);
    if (code.length === 0) continue;
    for (let i = 0; i < code.length; i++) {
      codes[code[i]] = true;
    }
  }
  return Object.keys(codes);
}
