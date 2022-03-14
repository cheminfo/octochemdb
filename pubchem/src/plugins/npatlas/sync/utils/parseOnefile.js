import OCL from 'openchemlib';

export function parseOnefile(json) {
  const results = [];
  for (const entry of json) {
    const oclMolecule = OCL.Molecule.fromSmiles(entry.smiles);
    const oclID = oclMolecule.getIDCodeAndCoordinates();
    oclMolecule.stripStereoInformation();
    const noStereoID = oclMolecule.getIDCode();
    const taxonomy = entry.origin_organism;
    const doi = entry.origin_reference.doi;

    const result = {
      ocl: {
        id: oclID.idCode,
        coordinates: oclID.coordinates,
        noStereoID,
      },
      origin: {
        taxonomy: taxonomy,
        doi: doi,
      },
    };

    results.push(result);
  }
  return results;
}
//https://www.npatlas.org/static/downloads/NPAtlas_download.json
