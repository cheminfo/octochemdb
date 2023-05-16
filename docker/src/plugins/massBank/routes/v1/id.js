import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromID');

const fromID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve mass spectrum from MassBank ID',
    description: '',
    querystring: {
      id: {
        type: 'string',
        description: 'MassBank ID',
        example: 'MSBNK-AAFC-AC000854',
        default: 'MSBNK-AAFC-AC000854',
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data.ocl.noStereoTautomerID, data.spectrum',
      },
    },
  },
  handler: searchHandler,
};

export default fromID;

async function searchHandler(request) {
  let { id = '', fields = 'data.ocl.noStereoTautomerID' } = request.query;

  let connection;
  try {
    connection = new OctoChemConnection();
    // get the collection
    const collection = await connection.getCollection('massBank');

    const results = await collection
      .aggregate([
        { $match: { _id: id } },
        { $limit: 1 },
        {
          $project: getFields(fields),
        },
      ])
      .next();
    return { data: results };
  } catch (e) {
    if (connection) {
      await debug.error(e.message, {
        collection: 'massBank',
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