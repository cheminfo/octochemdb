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
  } catch (e) {
    if (connection) {
      await debug.error(e.message, {
        collection: 'taxonomies',
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
