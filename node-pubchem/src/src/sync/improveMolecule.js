'use strict';

const OCL = require('openchemlib');
const { initOCL, getMF } = require('openchemlib-utils');
const { MF } = require('mf-parser');

initOCL(OCL);

module.exports = function getMolecule(molecule) {
  const oclMolecule = OCL.Molecule.fromMolfile(molecule.molfile);
  const oclID = oclMolecule.getIDCodeAndCoordinates();
  const oclIndex = oclMolecule.getIndex();
  const moleculeMF = getMF(oclMolecule);
  const mfParts = moleculeMF.parts;
  const nbFragments = mfParts.length;
  const mf = mfParts.join(' . ');
  const globalMF = moleculeMF.mf;
  oclMolecule.stripStereoInformation();
  const noStereoID = oclMolecule.getIDCode();

  const result = {
    _id: +molecule.PUBCHEM_COMPOUND_CID,
    seq: 0,
    ocl: {
      id: oclID.idCode,
      coordinates: oclID.coordinates,
      index: oclIndex,
    },
    noStereoID,
    iupac: molecule.PUBCHEM_IUPAC_NAME,
    mf: mf,
    nbFragments,
  };

  try {
    const mfInfo = new MF(globalMF).getInfo();
    result.em = mfInfo.monoisotopicMass;
    result.mw = mfInfo.mass;
    result.unsaturation = mfInfo.unsaturation;
    result.charge = mfInfo.charge;
    result.atom = mfInfo.atoms;
  } catch (e) {
    console.log(e, mf);
  }

  return result;
};
