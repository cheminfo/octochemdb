import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';

const debug = debugLibrary('searchIDs');

export async function searchHandler(request) {
  let data = getRequestQuery(request);
  let {
    patentsIDs = '',
    keywords = '',
    fields = 'data.title, _id, data.abstract',
    minScore = 0,
    limit = 100,
  } = data;
  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('patents');

    let matchParameters = {};
    let aggregateParameters;
    if (patentsIDs !== '') {
      matchParameters._id = { $in: patentsIDs.split(/[ ,;\t\r\n]+/) };
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
          $match: { score: { $gte: minScore } },
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
        collection: 'patents',
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
