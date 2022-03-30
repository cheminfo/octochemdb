import { PubChemConnection } from './server/utils.js';

async function doAll() {
  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('compounds');

    const results = await collection.stats();
    console.log(results);
  } catch (e) {
    console.log(e);
  } finally {
    console.log('Closing connection');
    if (connection) await connection.close();
  }
}

doAll();
