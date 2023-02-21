import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncGNPs';

test('syncGNPs', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('gnps');
  const collectionEntry = await collection
    .find({ _id: 'CCMSLIB00000001547' })
    .limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  const emptySmilesEntry = await collection
    .find({ _id: 'CCMSLIB00000001548' })
    .limit(1);
  const emptySmiles = await emptySmilesEntry.next();
  // expect(bronzeSpectrum) to be null
  expect(emptySmiles).toBeNull();
  await connection.close();
}, 30000);
