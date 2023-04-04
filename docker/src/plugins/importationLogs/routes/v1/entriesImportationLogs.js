// query for molecules from monoisotopic mass
import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('entries importation Logs');

const entriesImportationLogs = {
  method: 'GET',
  schema: {
    summary: 'Retrieve importation logs from a collection',
    description:
      'This route retrieves the importation logs for a given collection. This can be integrated in a monitoring system to keep under control the importation/aggregation process.',
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
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('importationLogs');
    if (collectionName === '') {
      collectionName = /(?<temp1>.*?)/;
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
      collectionName,
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
