import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';

const debug = debugLibrary('searchIDs');

export async function idsHandler(request) {
  const data = getRequestQuery(request);
  const { ids = '', fields = 'data' } = data;

  const formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('bioassaysPubChem');
    const matchParameters = {};

    if (ids !== '') {
      // AIDs are stored as numeric _id, so coerce each token before matching.
      matchParameters._id = {
        $in: ids
          .split(/[ ,;\t\r\n]+/)
          .filter(Boolean)
          .map(Number),
      };
    }

    const aggregateParameters = [
      { $match: matchParameters },
      { $project: formattedFields },
    ];

    const result = await collection.aggregate(aggregateParameters).toArray();

    return { data: result };
  } catch (error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'bioassaysPubChem',
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
