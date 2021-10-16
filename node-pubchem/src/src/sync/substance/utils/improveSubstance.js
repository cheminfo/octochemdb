function improveSubstance(molecule) {
  let result = {
    _id: +molecule.PUBCHEM_SUBSTANCE_ID,
    seq: 0,
    molfile: molecule.molfile,
  };
  delete molecule.PUBCHEM_SUBSTANCE_ID;

  for (let key in molecule) {
    if (!key.startsWith('PUBCHEM_')) continue;
    const parts = key.toLowerCase().replace('pubchem_', '').split('_');

    let subresult = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!subresult[part]) subresult[part] = {};
      subresult = subresult[part];
    }
    subresult[parts[parts.length - 1]] = molecule[key];
  }

  return result;
}

export default improveSubstance;
