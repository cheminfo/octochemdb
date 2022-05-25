import OCL from 'openchemlib';

import Debug from '../../../../utils/Debug.js';

const debug = Debug('getSubstanceData');
export function getSubstanceData(molecule) {
  try {
    let oclMolecule = OCL.Molecule.fromMolfile(molecule.molfile);
    const oclID = oclMolecule.getIDCodeAndCoordinates();
    oclMolecule.stripStereoInformation();
    const noStereoID = oclMolecule.getIDCode();
    let result = {
      id: oclID.idCode,
      coordinates: oclID.coordinates,
      noStereoID,
    };
    return result;
  } catch (e) {
    debug(e);
  }
}
