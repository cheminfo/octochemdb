import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncTaxonomies';

test('syncTaxonomies', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('taxonomies');
  const collectionEntry = await collection.find({ _id: 2841640 }).limit(1);
  const result = await collectionEntry.next();
  expect(result).toStrictEqual({
    _id: 2841640,
    _seq: 21,
    data: {
      superkingdom: 'Archaea',
      phylum: 'Candidatus Borrarchaeota',
      class: 'Candidatus Borrarchaeia',
      order: 'Candidatus Borrarchaeales',
      family: 'Candidatus Borrarchaeaceae',
      genus: 'Candidatus Borrarchaeum',
    },
  });
  if (connection) {
    await connection.close();
  }
});
