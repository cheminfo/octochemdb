import 'dotenv/config';
import delay from 'delay';
import { test, expect } from 'vitest';

import { PubChemConnection } from '../PubChemConnection';

test('connection to DB', async () => {
  const connection = new PubChemConnection();
  let colllectionList = await connection.getCollectionNames();
  while (!colllectionList.includes('compounds')) {
    await delay(1000);
    colllectionList = await connection.getCollectionNames();
  }
  const result = await connection.getCollection('compounds');
  expect(result.namespace).toBe('octochemdb.compounds');
  if (connection) {
    await connection.close();
  }
}, 30000);
