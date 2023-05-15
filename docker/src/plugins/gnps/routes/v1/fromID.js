import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromID');

const fromID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve mass spectrum from GNPS ID',
    description: '',
    querystring: {
      id: {
        type: 'string',
        description: 'GNPS ID',
        example: 'CCMSLIB00000001547',
        default: 'CCMSLIB00000001547',
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
    const collection = await connection.getCollection('gnps');

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
      debug.fatal(e.message, {
        collection: 'gnps',
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
