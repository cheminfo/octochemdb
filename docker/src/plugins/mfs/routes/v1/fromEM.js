// query for molecules from monoisotopic mass
import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';
import {getRequestQuery} from '../../../../utils/getRequestQuery.js';

const debug = debugLibrary('fromEM');

const fromEMs = {
  method: ['GET', 'POST'],
  schema: {
    summary: 'Find molecular formula from a monoisotopic mass',
    description:
      'Useful to retrieve all the molecular formula that have a given monoisotopic mass',
    querystring: {
      em: {
        type: 'string',
        description: 'Monoisotopic mass',
        example: '300.123, 259.0237',
        default: '',
      },
      minCount: {
        type: 'number',
        description: 'Minimum number of mfs in PubChem',
        default: 5,
      },
      precision: {
        type: 'number',
        description: 'Precision (in ppm) of the monoisotopic mass',
        default: 100,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 1000,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
    },
  },
  handler: searchHandler,
};

export default fromEMs;

async function searchHandler(request) {
  let data = getRequestQuery(request);
  let {
    em = '',
    minCount = 5,
    limit = 1e3,
    precision = 100,
    fields = 'data',
  } = data;

  if (limit > 1e4) limit = 1e4;
  if (limit < 1) limit = 1;

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('mfs');
    let ems = em
      .split(/[ ,;\t\r\n]+/)
      .filter((entry) => entry)
      .map(Number);
    let matchParameters;
    let error;
    if (ems.length > 1) {
      let match = [];

      for (let em of ems) {
        error = (em / 1e6) * precision;
        match.push({
          'data.em': { $lt: em + error, $gt: em - error },
          'data.count': { $gte: minCount },
        });
      }
      matchParameters = { $or: match };
    } else if (ems.length === 1 && ems[0] !== '') {
      error = (ems[0] / 1e6) * precision;

      matchParameters = {
        'data.em': { $lt: ems[0] + error, $gt: ems[0] - error },
        'data.count': { $gte: minCount },
      };
    }
    let fieldsToRetrieve = getFields(fields);
    const results = await collection
      .aggregate([
        {
          $match: matchParameters,
        },
        {
          $project: fieldsToRetrieve,
        },

        { $limit: Number(limit) },
      ])
      .toArray();
    return { data: results };
  } catch (e) {
    if (connection) {
      await debug.error(e.message, {
        collection: 'mfs',
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
