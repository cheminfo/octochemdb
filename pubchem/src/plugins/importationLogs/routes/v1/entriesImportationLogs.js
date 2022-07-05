// query for molecules from monoisotopic mass
import { getFields, PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('entries importation Logs');

const entriesImportationLogs = {
  method: 'GET',
  schema: {
    querystring: {
      collectionName: {
        type: 'string',
        description: 'Collection Name',
        example: 'bioassays',
        default: '',
      },
      limit: {
        type: 'number',
        description: 'Max result output, descending order (date)',
        example: 10,
        default: 1000,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default:
          'collectionName,sources,dateStart,dateEnd,startSequenceID,endSequenceID,status',
      },
    },
  },
  handler: searchHandler,
};

export default entriesImportationLogs;

/**
 * @description searchHandler - search logs from collection name
 * @param {*} request
 * @returns {Promise<*>} logs
 */
async function searchHandler(request) {
  let {
    collectionName = '',
    limit = 0,
    fields = 'collectionName,sources,dateStart,dateEnd,startSequenceID,endSequenceID,status',
  } = request.query;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('importationLogs');
    if (collectionName === '') {
      collectionName = /(.*?)/;
    }
    let formatedFields = getFields(fields);
    formatedFields._id = 0;
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
    debug({
      collectionName: collectionName,
    });

    return { data: results };
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'importationLogs',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
