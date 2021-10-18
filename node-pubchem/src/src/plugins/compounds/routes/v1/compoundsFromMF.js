// query for molecules from monoisotopic mass
import Debug from 'debug';

import { getFields } from '../../../../server/utils.js';
import PubChemConnection, {
  COMPOUNDS_COLLECTION,
} from '../../../../util/PubChemConnection.js';

const debug = Debug('compoundsFromMF');

const compoundsFromMF = {
  method: 'GET',
  schema: {
    querystring: {
      mf: {
        type: 'string',
        description: 'Molecular formula',
        example: 'Et3N',
        default: null,
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

export default compoundsFromMF;
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
    mf = '',
    limit = 1e3,
    fields = 'em,mf,total,atom,unsaturation',
  } = request.query;

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection(COMPOUNDS_COLLECTION);

    debug(mf);

    const results = await collection
      .aggregate([
        { $match: { mf } },
        { $limit: limit },
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
