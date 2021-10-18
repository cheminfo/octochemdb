export default function improveSubstance(molecule) {
  let result = {
    _id: +molecule.PUBCHEM_SUBSTANCE_ID,
    _seq: 0,
    data: {
      molfile: molecule.molfile,
    },
  };

  const dataResult = result.data;

  for (let key in molecule) {
    if (!key.startsWith('PUBCHEM_')) continue;
    const parts = key.toLowerCase().replace('pubchem_', '').split('_');

    let subresult = dataResult;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!subresult[part]) subresult[part] = {};
      subresult = subresult[part];
    }
    subresult[parts[parts.length - 1]] = molecule[key];
  }

  return result;
}
