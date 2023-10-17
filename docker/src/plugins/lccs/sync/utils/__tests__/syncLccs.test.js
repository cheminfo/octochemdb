import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../sync.js';

test('syncLccs', async () => {
  const connection = new OctoChemConnection();
  await sync(connection);
  const lccs = await connection.getCollection('lccs');
  const count = await lccs.countDocuments();
  const entry = await lccs.findOne();
  expect(count).toBe(4);
  expect(entry).toMatchSnapshot();
}, 1000000);
