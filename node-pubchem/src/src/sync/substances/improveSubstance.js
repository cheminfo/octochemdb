'use strict';

function improveSubstance(molecule) {
  let result = { molfile: molecule.molfile };

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

    console.log(result);
  }

  return result;
}

module.exports = improveSubstance;
