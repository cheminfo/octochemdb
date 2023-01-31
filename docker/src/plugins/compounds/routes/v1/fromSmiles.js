// query for molecules from monoisotopic mass
import OCL from 'openchemlib';

import { getFields, PubChemConnection } from '../../../../server/utils.js';
import getNoStereoIDCode from '../../../../sync/utils/getNoStreoIDCode.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromSmiles');

const fromSmiles = {
  method: 'GET',
  schema: {
    summary: 'Retrieve compounds from a SMILES',
    description: '',
    querystring: {
      smiles: {
        type: 'string',
        description: 'SMILES',
        example: 'c1ccccc1',
        default: 'c1ccccc1',
      },
      stereo: {
        type: 'boolean',
        description: 'Take into account the stereochemistry',
        default: true,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 1000,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data.em,data.mf,data.total,data.atom,data.unsaturation',
      },
    },
  },
  handler: searchHandler,
};

export default fromSmiles;

/**
 * Find compounds from a SMILES
 * @param {object} [request={}]
 * @param {object} [request.query={}]
 * @param {number} [request.query.smiles='']
 * @param {boolean} [request.query.stereo=true]
 * @param {number} [request.query.limit=1000]
 * @param {string} [request.query.fields='data.em,data.mf,data.total,data.atom,data.unsaturation']
 * @param {number} [request.query.minPubchemEntries=0]
 * @return {Promise<Document[]>}
 */

async function searchHandler(request) {
  let {
    smiles = '',
    limit = 1e3,
    stereo = true,
    fields = 'data.em,data.mf,data.total,data.atom,data.unsaturation',
  } = request.query;

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;

  const molecule = OCL.Molecule.fromSmiles(smiles);
  let mongoQuery = {};
  if (stereo) {
    mongoQuery = {
      'data.ocl.idCode': molecule.getIDCode(),
    };
  } else {
    mongoQuery = {
      'data.noStereoID': getNoStereoIDCode(molecule),
    };
  }

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('compounds');

    debug(smiles);

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
      debug(e.message, { collection: 'compounds', connection, stack: e.stack });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}