import { PubChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromID');

const fromID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve massSpectrum from ID',
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
        default: 'data.ocl.noStereoTautomerID',
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
    connection = new PubChemConnection();
    // get the collection
    const collection = await connection.getCollection('gnps');

    debug(id);
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
      debug(e.message, { collection: 'compounds', connection, stack: e.stack });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
