import OCL from 'openchemlib';

export function parseLotus(json) {
  const results = [];
  for (const entry of json) {
    const oclMolecule = OCL.Molecule.fromSmiles(entry.smiles);
    const oclID = oclMolecule.getIDCodeAndCoordinates();
    oclMolecule.stripStereoInformation();
    const noStereoID = oclMolecule.getIDCode();
    const taxonomy = entry.taxonomyReferenceObjects;
    const key = Object.keys(taxonomy)[0];
    const finalTaxonomy = taxonomy[key];

    const result = {
      ocl: {
        id: oclID.idCode,
        coordinates: oclID.coordinates,
        noStereoID,
      },
      origin: {
        taxonomy: finalTaxonomy,
      },
    };

    results.push(result);
  }
  return results;
}
//https://lotus.naturalproducts.net/download/mongo
