import OCL from 'openchemlib';

import getNoStereoIDCode from '../../../../sync/utils/getNoStreoIDCode.js';
import Debug from '../../../../utils/Debug.js';
/**
 * @description calculate the ocl substance data
 * @param {*} molecule data of the molecule in substance file
 * @returns {Promise} ocl molecule data
 */
export function getSubstanceData(molecule) {
  const debug = Debug('getSubstanceData');
  try {
    let oclMolecule = OCL.Molecule.fromMolfile(molecule.molfile);
    const oclID = oclMolecule.getIDCodeAndCoordinates();
    const noStereoID = getNoStereoIDCode(oclMolecule);
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
