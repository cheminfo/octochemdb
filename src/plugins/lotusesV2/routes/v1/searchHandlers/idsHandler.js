import { OctoChemConnection, getFields } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';
import { getRequestQuery } from '../../../../../utils/getRequestQuery.js';

const debug = debugLibrary('searchIDs');

/**
 * Handles ID-based search requests for the lotusesV2 collection.
 * @param request - Fastify request object.
 * @returns
 */
export async function idsHandler(request) {
  const data = getRequestQuery(request);
  const { ids = '', fields = 'data' } = data;

  const formattedFields = getFields(fields);
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('lotusesV2');
    /** @type {Record<string, any>} */
    const matchParameters = {};

    if (ids !== '') {
      matchParameters._id = {
        $in: ids.split(/[ ,;\t\r\n]+/).filter(Boolean),
      };
    }

    const aggregateParameters = [
      {
        $match: matchParameters,
      },
      { $project: formattedFields },
    ];

    const result = await collection.aggregate(aggregateParameters).toArray();

    return { data: result };
  } catch (/** @type {any} */ error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: 'lotusesV2',
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
