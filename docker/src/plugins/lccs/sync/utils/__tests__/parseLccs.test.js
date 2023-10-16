import { join } from 'path';

import { test, expect } from 'vitest';

import parseLccs from '../parseLccs.js';

test('parseLccs', async () => {
  const path = join(__dirname, '/data/test.xml');
  for await (let entry of parseLccs(path)) {
    //  console.log(entry);
  }
});
