import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('searchIDs');

export async function idHandler(request) {
  let { id = '', fields = 'data' } = request.query;
  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('patents');
    let matchParameters = {};
    let aggregateParameters;

    matchParameters._id = id;
    aggregateParameters = [
      {
        $match: matchParameters,
      },
      { $project: formattedFields },
    ];

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
