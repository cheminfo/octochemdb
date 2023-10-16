// query for molecules from monoisotopic mass
import { getFields, OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('entries importation Logs');

/**
 * @description searchHandler - search logs from collection name
 * @param {*} request
 * @returns {Promise<*>} logs
 */
export async function entriesImportationLogsHandler(request) {
  let {
    collectionName = '',
    limit = 1,
    fields = 'collectionName,sources,dateStart,dateEnd,startSequenceID,endSequenceID,status',
  } = request.query;

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('importationLogs');
    if (collectionName === '') {
      collectionName = /(?<temp1>.*?)/;
    }
    let formatedFields = getFields(fields);
    const results = await collection
      .aggregate([
        {
          $match: {
            collectionName,
          },
        },
        { $sort: { dateStart: -1 } },
        { $limit: Number(limit) },
        {
          $project: formatedFields,
        },
      ])
      .toArray();

    return { data: results };
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'importationLogs',
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
