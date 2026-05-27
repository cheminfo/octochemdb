// query for molecules from monoisotopic mass
import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('searchIDs');

export async function idHandler(request) {
  let { id = '', fields = 'data' } = request.query;

  let formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('lccs');
    let matchParameters = {};
    let aggregateParameters;

    if (id !== '') {
      matchParameters._id = {
        $in: id
          .split(/[ ,;\t\r\n]+/)
          .filter(Boolean)
          .map(Number),
      };
    }

    aggregateParameters = [
      {
        $match: matchParameters,
      },
      { $project: formattedFields },
    ];

    const result = await collection.aggregate(aggregateParameters).toArray();

    return { data: result };
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'lccs',
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
