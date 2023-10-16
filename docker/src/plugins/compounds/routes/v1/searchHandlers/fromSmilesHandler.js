import OCL from 'openchemlib';

import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getNoStereosFromCache } from '../../../../../utils/getNoStereosFromCache.js';

const debug = debugLibrary('fromSmiles');

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
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'compounds',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug.trace('Closing connection');
    if (connection) await connection.close();
  }
}
