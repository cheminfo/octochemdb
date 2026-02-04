import { readFileSync } from 'fs';
import { join } from 'path';

import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import { parseMassBank } from '../parseMassBank';

dotenv.config();
test('parseMassBank', async () => {
  const blob = readFileSync(join(__dirname, 'data/massBank.msp'));
  const connection = 'test';
  const results = [];
  for await (const result of parseMassBank(blob, connection)) {
    results.push(result);
  }
  expect(results).toHaveLength(2);
  if (results) {
    for (const entry of results) {
      if (entry?.data?.ocl) {
        delete entry.data.ocl.coordinates;
      }
    }
  }
  expect(results).toMatchSnapshot();
});
