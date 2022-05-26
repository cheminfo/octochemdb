import { bsonIterator } from 'bson-iterator';
import OCL from 'openchemlib';

import Debug from '../../../../utils/Debug.js';
import readStreamInZipFolder from '../../../../utils/readStreamInZipFolder.js';

const debug = Debug('parseCoconuts');

export async function* parseCoconuts(bsonPath, filename, connection) {
  try {
    const readStream = await readStreamInZipFolder(bsonPath, filename);
    for await (const entry of bsonIterator(readStream)) {
      try {
        const oclMolecule = OCL.Molecule.fromSmiles(entry.clean_smiles);
        const oclID = oclMolecule.getIDCodeAndCoordinates();
        oclMolecule.stripStereoInformation();
        const noStereoID = oclMolecule.getIDCode();
        const taxonomies = entry?.textTaxa;
        const finalTaxonomies = [];
        const comments = [];
        if (taxonomies[0] !== 'notax') {
          for (let entry of taxonomies) {
            if (
              entry.split('$').length === 1 &&
              entry !== 'Bacteria' &&
              entry !== 'Eukaryota' &&
              entry !== 'Archaea'
            ) {
              finalTaxonomies.push({ species: entry });
            } else {
              comments.push(entry);
            }
          }
        }

        const result = {
          _id: entry.coconut_id,
          data: {
            ocl: {
              id: oclID.idCode,
              noStereoID,
            },
          },
        };
        if (entry.cas) result.data.cas = entry?.cas;
        if (entry.iupac_name) result.data.iupacName = entry?.iupac_name;
        if (finalTaxonomies.length !== 0) {
          result.data.taxonomies = finalTaxonomies;
        }
        if (comments.length !== 0) result.data.comments = comments;
        yield result;
      } catch (e) {
        const optionsDebug = { collection: 'coconuts', connection };
        debug(e, optionsDebug);
        continue;
      }
    }
  } catch (e) {
    const optionsDebug = { collection: 'coconuts', connection };
    debug(e, optionsDebug);
  }
}
