import { rmSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncBioassaysPubChem';

test.skip('syncBioassaysPubChem', async () => {
  const connection = new OctoChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('bioassaysPubChem');
  // @ts-ignore
  const result = await collection.findOne({ _id: 22001 });

  expect(result).toMatchSnapshot();

  await connection.close();
  rmSync(join(__dirname, '/data/syncData/syncTest/'), { recursive: true });
});
