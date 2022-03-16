import OCL from 'openchemlib';

export function parseCoconut(json) {
  const results = [];
  for (const entry of json) {
    const oclMolecule = OCL.Molecule.fromSmiles(entry.originalSmiles);
    const oclID = oclMolecule.getIDCodeAndCoordinates();
    oclMolecule.stripStereoInformation();
    const noStereoID = oclMolecule.getIDCode();
    const taxonomy = entry.uniqueNaturalProduct.textTaxa;

    const result = {
      _id: noStereoID,
      ocl: {
        id: oclID.idCode,
        coordinates: oclID.coordinates,
        noStereoID,
        nameCompound: entry.synonyms,
        cas: entry.uniqueNaturalProduct.cas,
      },
      origin: {
        taxonomy: taxonomy,
      },
    };

    results.push(result);
  }
  return results;
}
//https://coconut.naturalproducts.net/download/mongo
