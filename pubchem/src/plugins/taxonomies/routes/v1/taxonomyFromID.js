// query for molecules from monoisotopic mass
import { PubChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('taxonomyFromID');

const taxonomyFromID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve taxonomy from ncbi taxonomy ID',
    description: 'Allows to search for taxonomy.',
    querystring: {
      id: {
        type: 'number',
        description: 'ncbi taxonomy ID',
        example: 662756,
        default: 562,
      },
    },
  },
  handler: searchHandler,
};

export default taxonomyFromID;
/**
 * Find molecular formula from a monoisotopic mass
 * @param {object} [request={}]
 * @param {object} [request.query={}]
 * @param {number} [request.query.id]
 * @return {Promise}
 */

async function searchHandler(request) {
  let { id } = request.query;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('taxonomies');
    // need to await otherwise connectioin is closed before execution
    const result = await collection.findOne({ _id: id });
    return { data: result };
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'taxonomies',
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
