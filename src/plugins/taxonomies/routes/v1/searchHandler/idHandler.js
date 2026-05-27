// query for molecules from monoisotopic mass
import { OctoChemConnection } from '../../../../../server/utils.js';
import debugLibrary from '../../../../../utils/Debug.js';

const debug = debugLibrary('taxonomyFromID');

export async function idHandler(request) {
  let { id } = request.query;

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('taxonomies');
    // need to await otherwise connectioin is closed before execution
    const result = await collection.findOne({ _id: id });
    return { data: result };
  } catch (error) {
    if (connection) {
      await debug.error(error.message, {
        collection: 'taxonomies',
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
