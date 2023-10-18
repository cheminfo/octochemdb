// query for molecules from monoisotopic mass
import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';

const debug = debugLibrary('search');

export async function searchHandler(request) {
  let data = getRequestQuery(request);
  let {
    ids = '',
    keywords = '',
    fields = 'data',
    minScore = 0,
    limit = 100,
  } = data;
  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('pubmeds');
    let matchParameters = {};
    let aggregateParameters;
    if (ids !== '') {
      matchParameters._id = {
        $in: ids
          .split(/[ ,;\t\r\n]+/)
          .filter((entry) => entry)
          .map(Number),
      };
    }
    if (keywords !== '') {
      matchParameters.$text = { $search: keywords };
      formattedFields.score = { $meta: 'textScore' };

      aggregateParameters = [
        {
          $match: matchParameters,
        },

        { $project: formattedFields },
        {
          $match: { score: { $gt: minScore } },
        },

        { $limit: Number(limit) },
      ];
    }
    if (keywords === '') {
      aggregateParameters = [
        {
          $match: matchParameters,
        },
        { $project: formattedFields },
        { $limit: Number(limit) },
      ];
    }

    const result = await collection.aggregate(aggregateParameters).toArray();

    return { data: result };
  } catch (e) {
    if (connection) {
      await debug.error(e.message, {
        collection: 'pubmeds',
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
