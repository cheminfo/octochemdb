import rules from './rules.js';

exports.getAtoms = function getAtoms(chemcalcMF) {
  const atom = {};
  let atoms = chemcalcMF.ea;
  atoms.forEach((a) => (atom[a.element] = a.number));
  return atom;
};

exports.isFormulaAllowed = function isFormulaAllowed(
  formula,
  minMass,
  maxMass,
) {
  if (formula.em > maxMass || formula.em < minMass) {
    return false;
  }
  if (!('C' in formula.atom)) {
    return false;
  }
  for (let key in formula.atom) {
    if (!rules.allowedElements.includes(key)) {
      return false;
    }
  }
  return true;
};

const elementRatios = rules.elementRatios;
const elementRatiosArray = new Array(elementRatios.length);
for (let j = 0; j < elementRatios.length; j++) {
  let topAtoms = elementRatios[j].split('/')[0];
  let bottomAtoms = elementRatios[j].split('/')[1];
  elementRatiosArray[j] = {
    topAtoms: topAtoms.split(/(?=[A-Z])/),
    bottomAtoms: bottomAtoms.split(/(?=[A-Z])/),
  };
}

exports.addRatios = function addRatios(formulas) {
  for (let j = 0; j < elementRatios.length; j++) {
    let topAtomsArray = elementRatiosArray[j].topAtoms;
    let bottomAtomsArray = elementRatiosArray[j].bottomAtoms;
    for (let i = 0; i < formulas.length; i++) {
      let mf = formulas[i];
      if (j === 0) mf.ratios = {};
      let top = getSumAtoms(topAtomsArray, mf);
      let bottom = getSumAtoms(bottomAtomsArray, mf);
      mf.ratios[elementRatios[j]] = Math.log2(top / bottom);
    }
  }
};

exports.addRatio = function addRatio(mf) {
  for (let j = 0; j < elementRatios.length; j++) {
    let topAtomsArray = elementRatiosArray[j].topAtoms;
    let bottomAtomsArray = elementRatiosArray[j].bottomAtoms;
    if (j === 0) mf.ratios = {};
    let top = getSumAtoms(topAtomsArray, mf);
    let bottom = getSumAtoms(bottomAtomsArray, mf);
    mf.ratios[elementRatios[j]] = Math.log2(top / bottom);
  }
};

function getSumAtoms(atoms, mf) {
  let sum = 0;
  for (let k = 0; k < atoms.length; k++) {
    if (mf.atom[atoms[k]]) sum += mf.atom[atoms[k]];
  }
  return sum;
}
