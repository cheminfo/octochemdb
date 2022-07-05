import { PubChemConnection } from './server/utils.js';
import Debug from './utils/Debug.js';

const debug = Debug('test');

async function doAll() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('compounds');

    const results = await collection.stats();
    debug(results);
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'test', connection, stack: e.stack });
    }
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}

doAll();
