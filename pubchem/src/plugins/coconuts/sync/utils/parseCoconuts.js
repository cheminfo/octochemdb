import { bsonIterator } from 'bson-iterator';
import OCL from 'openchemlib';

import Debug from '../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';
import readStreamInZipFolder from '../../../../utils/readStreamInZipFolder.js';

const debug = Debug('parseCoconuts');
/**
 * @description Parse the coconuts file from the coconut database and yield result to be imported
 * @param {*} bsonPath path to the bson file
 * @param {*} filename filename of the bson file
 * @param {*=} connection MongoDB connection
 * @yields {Object} yields the result to be imported
 */
export async function* parseCoconuts(bsonPath, filename, connection) {
  try {
    const readStream = await readStreamInZipFolder(bsonPath, filename);
    for await (const entry of bsonIterator(readStream)) {
      try {
        // get noStereoID for the molecule
        const oclMolecule = OCL.Molecule.fromSmiles(
          entry.clean_smiles || entry.smiles,
        );
        const ocl = await getNoStereosFromCache(oclMolecule, connection);
        // parse taxonomies if available
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
              // know only the superkingdom is useless (they are just 4) and could potentially be wrong, why should someone describe just describe the superkingdom?
              // It's more safe to just ignore it instead of considering it as a taxonomy
              finalTaxonomies.push({ species: entry });
            } else {
              comments.push(entry);
            }
          }
        }
        // define result to be imported
        const result = {
          _id: entry.coconut_id,
          data: {
            ocl,
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
        if (connection) {
          debug(e.message, {
            collection: 'coconuts',
            connection,
            stack: e.stack,
          });
        }
        continue;
      }
    }
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'coconuts', connection, stack: e.stack });
    }
  }
}
