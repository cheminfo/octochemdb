import { createReadStream } from 'fs';
import { join } from 'path';

import { bsonIterator } from 'bson-iterator';
import OCL from 'openchemlib';

export async function parseCoconut(json) {
  const results = [];
  const readStream = createReadStream(join(json));
  for await (const entry of bsonIterator(readStream)) {
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
