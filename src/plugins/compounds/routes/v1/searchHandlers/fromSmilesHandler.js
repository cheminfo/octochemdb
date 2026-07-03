import OCL from 'openchemlib';

import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../../utils/getNoStereosFromCache.js';

const debug = debugLibrary('fromSmiles');

/**
 * Searches the compounds collection for entries matching a SMILES, optionally ignoring stereochemistry.
 * @param request - Fastify request; query may contain smiles, stereo (when false, matches by noStereoTautomerID via cache), limit (max results, clamped to 1..1e4) and fields (comma-separated projection).
 * @returns Object with a `data` array of matching compounds, or an `errors` array on failure.
 */
export async function fromSmilesHandler(request) {
  let {
    smiles = '',
    limit = 1e3,
    stereo = true,
    fields = 'data.em,data.mf,data.total,data.atom,data.unsaturation',
  } = request.query;

  let connection;
  try {
    if (limit > 1e4) limit = 1e4;
    if (limit < 1) limit = 1;

    const molecule = OCL.Molecule.fromSmiles(smiles);
    let mongoQuery = {};
    if (stereo) {
      mongoQuery = {
        'data.ocl.idCode': molecule.getIDCode(),
      };
    } else {
      let stereoCache = await getNoStereosFromCache(
        molecule,
        connection,
        'compounds',
      );
      mongoQuery = {
        'data.ocl.noStereoTautomerID': stereoCache?.noStereoTautomerID,
      };
    }

    connection = new OctoChemConnection();
    const collection = await connection.getCollection('compounds');

    const results = await collection
      .aggregate([
        { $match: mongoQuery },
        { $limit: Number(limit) },
        {
          $project: getFields(fields),
        },
      ])
      .toArray();
    return { data: results };
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'compounds',
        connection,
        stack: error.stack,
      });
    }
    return { errors: [{ title: error.message, detail: error.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}
