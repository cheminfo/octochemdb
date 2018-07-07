'use strict';

exports.getAtoms = function getAtoms(chemcalcMF) {
  const atom = {};
  var atoms = chemcalcMF.ea;
  atoms.forEach((a) => atom[a.element] = a.number);
  return atom;
};

const rules = require('./rules');

exports.isFormulaAllowed = function isFormulaAllowed(formula, minMass, maxMass) {
  if (formula.em > maxMass || formula.em < minMass) {
    return false;
  }
  if (!('C' in formula.atom)) {
    return false;
  }
  for (var key in formula.atom) {
    if (!rules.allowedElements.includes(key)) {
      return false;
    }
  }
  return true;
};

const elementRatios = rules.elementRatios;
const elementRatiosArray = new Array(elementRatios.length);
for (var j = 0; j < elementRatios.length; j++) {
  var topAtoms = elementRatios[j].split('/')[0];
  var bottomAtoms = elementRatios[j].split('/')[1];
  elementRatiosArray[j] = {
    topAtoms: topAtoms.split(/(?=[A-Z])/),
    bottomAtoms: bottomAtoms.split(/(?=[A-Z])/)
  };
}

exports.addRatios = function addRatios(formulas) {
  for (var j = 0; j < elementRatios.length; j++) {
    var topAtomsArray = elementRatiosArray[j].topAtoms;
    var bottomAtomsArray = elementRatiosArray[j].bottomAtoms;
    for (var i = 0; i < formulas.length; i++) {
      var mf = formulas[i];
      if (j === 0) mf.ratios = {};
      var top = getSumAtoms(topAtomsArray, mf);
      var bottom = getSumAtoms(bottomAtomsArray, mf);
      mf.ratios[elementRatios[j]] = Math.log2(top / bottom);
    }
  }
};

exports.addRatio = function addRatio(mf) {
  for (var j = 0; j < elementRatios.length; j++) {
    var topAtomsArray = elementRatiosArray[j].topAtoms;
    var bottomAtomsArray = elementRatiosArray[j].bottomAtoms;
    if (j === 0) mf.ratios = {};
    var top = getSumAtoms(topAtomsArray, mf);
    var bottom = getSumAtoms(bottomAtomsArray, mf);
    mf.ratios[elementRatios[j]] = Math.log2(top / bottom);
  }
};

function getSumAtoms(atoms, mf) {
  var sum = 0;
  for (var k = 0; k < atoms.length; k++) {
    if (mf.atom[atoms[k]]) sum += mf.atom[atoms[k]];
  }
  return sum;
}
