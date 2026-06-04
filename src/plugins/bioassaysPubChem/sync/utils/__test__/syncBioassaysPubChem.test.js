import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncBioassaysPubChem';

test('syncBioassaysPubChem', async () => {
  const connection = new OctoChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('bioassaysPubChem');
  // @ts-ignore - numeric _id is the PubChem AID, not an ObjectId
  const result = await collection.findOne({ _id: 22001 });

  expect(result).toMatchSnapshot();

  await connection.close();

  const extractedDir = join(__dirname, '/data/syncData/syncTest/');
  if (existsSync(extractedDir)) {
    rmSync(extractedDir, { recursive: true });
  }
});
