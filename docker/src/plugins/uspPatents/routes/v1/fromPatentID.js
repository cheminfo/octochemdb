// query for molecules from monoisotopic mass
import { OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromPatentID');

const fromPatentID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve patent Title and Abstract from USPTO patent ID',
    description: 'Allows to search for patent Title and Abstract.',
    querystring: {
      id: {
        type: 'string',
        description: 'USPTO patent ID',
        example: 'US20010000048A1',
        default: 'US20010000048A1',
      },
    },
  },
  handler: searchHandler,
};

export default fromPatentID;

async function searchHandler(request) {
  let { id = '' } = request.query;

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('uspPatents');
    // need to await otherwise connectioin is closed before execution
    const result = await collection.findOne({ _id: id });
    return { data: result };
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'uspPatents',
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
