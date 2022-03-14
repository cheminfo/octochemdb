import OCL from 'openchemlib';

export function parseCoconut(json) {
  const results = [];
  for (const entry of json) {
    const oclMolecule = OCL.Molecule.fromSmiles(entry.originalSmiles);
    const oclID = oclMolecule.getIDCodeAndCoordinates();
    oclMolecule.stripStereoInformation();
    const noStereoID = oclMolecule.getIDCode();
    const taxonomy = entry.taxonomyReferenceObjects;
    const doi = entry.citationDOI;
    const source = entry.source;

    const result = {
      ocl: {
        id: oclID.idCode,
        coordinates: oclID.coordinates,
        noStereoID,
        name: entry.synonyms,
        cas: entry.cas,
      },
      origin: {
        taxonomy: taxonomy,
        doi: doi,
        source: source,
      },
    };

    results.push(result);
  }
  return results;
}
//https://coconut.naturalproducts.net/download/mongo
