// test the importation of taxonomies in taxonomies collection using syncTaxonomies
/**
 * @description test the importation of taxonomies in taxonomies collection using syncTaxonomies
 * @param {*} connection mongoDB connection
 */
import 'dotenv/config';

import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../syncVersionForTest/syncTaxonomiesTest.js';

// The sync test version function was adapted to work without cron and to break after 20 imports
// The temporary collection part is not tested
// The collection created for the test as well as the admin and logs entries are removed at the end of the test
// The test version returns the last document imported while the original version has no return
// The test version was made to avoid to adapt the original version to work with jest and also because in future will be easier to test new features with a test version available
test('syncTaxonomies', async () => {
  const connection = new PubChemConnection();

  const lastDocumentImported = await sync(connection);

  expect(lastDocumentImported).toStrictEqual({
    _id: 2841640,
    _seq: 21,
    data: {
      class: 'Candidatus Borrarchaeia',
      family: 'Candidatus Borrarchaeaceae',
      genus: 'Candidatus Borrarchaeum',
      order: 'Candidatus Borrarchaeales',
      phylum: 'Candidatus Borrarchaeota',
      species: 'Candidatus Borrachaaeum sp. lw60_2018_gm2_56',
      superkingdom: 'Archaea',
    },
  });
}, 50000);
