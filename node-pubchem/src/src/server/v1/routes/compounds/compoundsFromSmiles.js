// query for molecules from monoisotopic mass
import Debug from 'debug';
import OCL from 'openchemlib';

import PubChemConnection, {
  COMPOUNDS_COLLECTION,
} from '../../../../util/PubChemConnection.js';

import getFields from './utils/getFields.js';

const debug = Debug('compoundsFromSmiles');

const compoundsFromSmiles = {
  method: 'GET',
  url: '/compounds/compoundsFromSmiles',
  schema: {
    querystring: {
      smiles: {
        type: 'string',
        description: 'SMILES',
        example: 'c1ccccc1',
        default: null,
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
        default: 'em,mf,total,atom,unsaturation',
      },
    },
  },
  handler: searchHandler,
};

export default compoundsFromSmiles;

/**
 * Find molecular formula from a monoisotopic mass
 * @param {number} em
 * @param {object} [options={}]
 * @param {object} [options.limit=1000]
 * @param {object} [options.precision=100]
 * @param {object} [options.minPubchemEntries=0]
 * @return {Array}
 */

async function searchHandler(request) {
  let {
    smiles = '',
    limit = 1e3,
    stereo = true,
    fields = 'em,mf,total,atom,unsaturation',
  } = request.query;

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;

  const molecule = OCL.Molecule.fromSmiles(smiles);
  let mongoQuery = {};
  if (stereo) {
    mongoQuery = {
      'ocl.id': molecule.getIDCode(),
    };
  } else {
    molecule.stripStereoInformation();
    mongoQuery = {
      noStereoID: molecule.getIDCode(),
    };
  }

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection(COMPOUNDS_COLLECTION);

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
    return results;
  } catch (e) {
    console.log(e);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
