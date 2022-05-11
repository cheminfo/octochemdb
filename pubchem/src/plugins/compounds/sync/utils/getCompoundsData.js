import MFParser from 'mf-parser';
import OCL from 'openchemlib';
import { getMF } from 'openchemlib-utils';

import Debug from '../../../../utils/Debug.js';

const { MF } = MFParser;
const debug = Debug('getCompoundsData');

export async function getCompoundsData(molecule) {
  let oclMolecule;
  if (molecule.molefile) {
    oclMolecule = OCL.Molecule.fromMolfile(molecule.molfile);
  } else {
    oclMolecule = OCL.Molecule.fromIDCode(molecule.noStereoID);
  }

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
        id: oclID.idCode,
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
      mf: mf,
      nbFragments,
    },
  };

  try {
    const mfInfo = new MF(globalMF).getInfo();
    result.data.em = mfInfo.monoisotopicMass;
    result.data.mw = mfInfo.mass;
    result.data.unsaturation = mfInfo.unsaturation;
    result.data.charge = mfInfo.charge;
    result.data.atom = mfInfo.atoms;
  } catch (e) {
    debug(`${e}, ${mf}`);
  }
  return result;
}
