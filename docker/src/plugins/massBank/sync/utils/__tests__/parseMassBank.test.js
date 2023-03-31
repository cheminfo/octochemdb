import { createReadStream } from 'fs';
import { createInterface } from 'readline';

import { test, expect } from 'vitest';

import { parseMassBank } from '../parseMassBank';

test('syncGNPs', async () => {
  const path = './__tests__/massBank.msp';
  const connection = 'test';
  const result = [];
  const mspStream = createReadStream(path, 'utf8');
  const lines = createInterface({ input: mspStream });
  for await (let entry of parseMassBank(lines, connection)) {
    result.push(entry);
    console.log(entry);
  }
}, 30000);
