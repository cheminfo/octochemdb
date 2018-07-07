'use strict';

const OCLE = require('openchemlib-extended');
const chemcalc = require('chemcalc');

const mfUtil = require('../util/mf');

module.exports = function getMolecule(molecule) {
  const oclMol = OCLE.Molecule.fromMolfile(molecule.molfile);
  const oclID = oclMol.getIDCodeAndCoordinates();
  const mfParts = oclMol.getMF().parts;
  const nbFragments = mfParts.length;
  const mf = mfParts.join('.');

  const result = {
    _id: +molecule.PUBCHEM_COMPOUND_CID,
    seq: 0,
    ocl: {
      id: oclID.idCode,
      coordinates: oclID.coordinates,
      index: oclMol.getIndex()
    },
    iupac: molecule.PUBCHEM_IUPAC_NAME,
    mf: mf,
    nbFragments
  };

  try {
    const chemcalcMF = chemcalc.analyseMF(mf);
    result.em = chemcalcMF.em;
    result.mw = chemcalcMF.mw;
    result.unsaturation = chemcalcMF.unsaturation;
    result.charge = chemcalcMF.charge;
    result.atom = mfUtil.getAtoms(chemcalcMF);
  } catch (e) {
    console.log(e, mf);
  }

  return result;
};
