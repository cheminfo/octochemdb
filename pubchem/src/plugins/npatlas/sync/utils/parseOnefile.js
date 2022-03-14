import OCL from 'openchemlib';

export function parseOnefile(json) {
  const results = [];
  for (const entry of json) {
    const oclMolecule = OCL.Molecule.fromSmiles(entry.smiles);
    const oclID = oclMolecule.getIDCodeAndCoordinates();
    oclMolecule.stripStereoInformation();
    const noStereoID = oclMolecule.getIDCode();

    const result = {
      ocl: {
        id: oclID.idCode,
        coordinates: oclID.coordinates,
        noStereoID,
      },
    };

    results.push(result);
  }
  return results;
}
