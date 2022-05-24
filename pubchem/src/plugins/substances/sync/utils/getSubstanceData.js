import OCL from 'openchemlib';
import Debug from '../../../../utils/Debug.js';
const debug = Debug('getSubstanceData');
export function getSubstanceData(molecule, connection) {
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
    const optionsDebug = { collection: 'substances', connection };
    debug(e, optionsDebug);
  }
}
