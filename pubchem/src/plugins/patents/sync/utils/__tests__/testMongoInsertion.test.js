// test the importation of taxonomies in taxonomies collection using syncTaxonomies
/**
 * @description test the importation of taxonomies in taxonomies collection using syncTaxonomies
 * @param {*} connection mongoDB connection
 */
import 'dotenv/config';

import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';

// The sync test version function was adapted to work without cron and to break after 20 imports
// The temporary collection part is not tested
// The collection created for the test as well as the admin and logs entries are removed at the end of the test
// The test version returns the last document imported while the original version has no return
// The test version was made to avoid to adapt the original version to work with jest and also because in future will be easier to test new features with a test version available
test('syncTaxonomies', async () => {
  const connection = new PubChemConnection();

  // generate array with where each entry is a combination of random number and letters to a maximum of 10 characters

  let timeStart = Date.now();
  await sync(connection);
  let timeEnd = Date.now();
  let finalTime = timeEnd - timeStart;

  expect(finalTime).toBe(1000);
}, 50000);

async function sync(connection) {
  let index = 1;
  let nbDocuments = 150;
  let patents = [];
  let randomString = Math.random().toString(36).substring(0, 10);
  for (let i = 0; i < 10000; i++) {
    patents.push(randomString);
  }
  const collection = await connection.getCollection('test_tmp');
  for (let i = 0; i < nbDocuments; i++) {
    await collection.insertOne({
      _id: index,
      data: {
        patents: patents,
        nbPatents: patents.length,
      },
    });
    index++;
  }
  await collection.drop();
}
