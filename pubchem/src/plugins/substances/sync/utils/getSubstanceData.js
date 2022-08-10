import OCL from 'openchemlib';

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
