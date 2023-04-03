import { readFileSync } from 'fs';
import { join } from 'path';

import 'dotenv/config';
import { test, expect } from 'vitest';

import { parseMassBank } from '../parseMassBank';

test('parseMassBank', async () => {
  const blob = readFileSync(join(__dirname, 'data/massBank.msp'));
  const connection = 'test';
  const results = await parseMassBank(blob, connection);
  expect(results).toHaveLength(2);
  expect(results).toMatchSnapshot();
}, 30000);
