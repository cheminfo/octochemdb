import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncBioassaysPubChem';

test('syncBioassaysPubChem', async () => {
  const connection = new OctoChemConnection();

  await sync(connection);
  const collection = await connection.getCollection('bioassaysPubChem');
  const result = await collection.findOne({});
  console.log(result);
  // expect(result).toMatchSnapshot();
  await connection.close();
});
