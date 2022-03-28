import { createReadStream } from 'fs';
import { join } from 'path';

import { bsonIterator } from 'bson-iterator';
import OCL from 'openchemlib';

export async function* parseCoconut(bsonPath) {
  const readStream = createReadStream(join(bsonPath));

  for await (const entry of bsonIterator(readStream)) {
    try {
      // console.log(entry);
      const oclMolecule = OCL.Molecule.fromSmiles(entry.clean_smiles);
      const oclID = oclMolecule.getIDCodeAndCoordinates();
      oclMolecule.stripStereoInformation();
      const noStereoID = oclMolecule.getIDCode();
      const taxonomies = entry?.textTaxa;
      const finalTaxonomy = [];
      const comment = [];
      if (taxonomies[0] !== 'notax') {
        for (let entry of taxonomies) {
          if (
            entry.split('$').length === 1 &&
            entry !== 'Bacteria' &&
            entry !== 'Eukaryota' &&
            entry !== 'Archaea'
          ) {
            finalTaxonomy.push({ species: entry });
          } else {
            comment.push(entry);
          }
        }
      }

      const result = {
        _id: entry.coconut_id,
        data: {
          ocl: {
            id: oclID.idCode,
            coordinates: oclID.coordinates,
            noStereoID,
          },
          taxonomy: {
            taxonomy: finalTaxonomy,
            comment: comment,
          },

          cas: entry?.cas,
          iupacName: entry?.iupac_name,
        },
      };
      yield result;
    } catch (e) {
      continue;
    }
  }
}
