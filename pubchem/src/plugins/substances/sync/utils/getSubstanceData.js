import OCL from 'openchemlib';

export async function getSubstanceData(molecule) {
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
}
