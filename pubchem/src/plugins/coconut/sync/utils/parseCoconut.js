import { createReadStream } from 'fs';
import { join } from 'path';

import { bsonIterator } from 'bson-iterator';
import OCL from 'openchemlib';

export async function parseCoconut(bsonPath) {
  const results = [];
  const readStream = createReadStream(join(bsonPath));

  for await (const entry of bsonIterator(readStream)) {
    try {
      const oclMolecule = OCL.Molecule.fromSmiles(entry.clean_smiles);
      const oclID = oclMolecule.getIDCodeAndCoordinates();
      oclMolecule.stripStereoInformation();
      const noStereoID = oclMolecule.getIDCode();
      const taxonomy = entry.textTaxa;

      const result = {
        _id: entry.coconut_id,
        ocl: {
          id: oclID.idCode,
          coordinates: oclID.coordinates,
          noStereoID,
          nameCompound: entry.synonyms,
        },
        origin: {
          taxonomy: taxonomy,
        },
        cas: entry.cas,
      };
      results.push(result);
    } catch (__java$exception) {
      continue;
    }
  }
  return results;
}
