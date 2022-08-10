import MFParser from 'mf-parser';
import OCL from 'openchemlib';
import { getMF } from 'openchemlib-utils';

import Debug from '../../../../utils/Debug.js';

const { MF } = MFParser;
const debug = Debug('getCompoundsData');
/**
 * @description Calculate compounds properties (e.g. charge, OCL ID, molecular formula, etc.)
 * @param {*} molecule molecule from pubchem file
 * @returns {Object} compounds properties
 */
export function getCompoundsData(molecule) {
  let oclMolecule;
  if (molecule.molfile) {
    oclMolecule = OCL.Molecule.fromMolfile(molecule.molfile);
  } else {
    oclMolecule = OCL.Molecule.fromIDCode(molecule.noStereoID);
  }
  // calculate molecule properties (e.g. charge, OCL ID, molecular formula, etc.)
  const oclProperties = new OCL.MoleculeProperties(oclMolecule);
  const oclID = oclMolecule.getIDCodeAndCoordinates();
  const oclIndex = Array.from(oclMolecule.getIndex());
  const moleculeMF = getMF(oclMolecule);
  const mfParts = moleculeMF.parts;
  const nbFragments = mfParts.length;
  const mf = mfParts.join(' . ');
  const globalMF = moleculeMF.mf;
  oclMolecule.stripStereoInformation();
  const noStereoID = oclMolecule.getIDCode();
  let result = {
    data: {
      ocl: {
        idCode: oclID.idCode,
        coordinates: oclID.coordinates,
        index: oclIndex,
        noStereoID,

        acceptorCount: oclProperties.acceptorCount,
        donorCount: oclProperties.donorCount,
        logP: oclProperties.logP,
        logS: oclProperties.logS,
        polarSurfaceArea: oclProperties.polarSurfaceArea,
        rotatableBondCount: oclProperties.rotatableBondCount,
        stereoCenterCount: oclProperties.stereoCenterCount,
      },
      mf,
      nbFragments,
    },
  };

  try {
    // calculate molecular formula properties (ex. exact mass, unsaturations, etc.)
    const mfInfo = new MF(globalMF).getInfo();
    result.data.em = mfInfo.monoisotopicMass;
    result.data.mw = mfInfo.mass;
    result.data.unsaturation = mfInfo.unsaturation;
    result.data.charge = mfInfo.charge;
    result.data.atom = mfInfo.atoms;
  } catch (e) {
    debug(e);
  }
  return result;
}
