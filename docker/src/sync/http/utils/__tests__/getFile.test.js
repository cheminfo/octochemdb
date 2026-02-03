import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import getFile from '../getFile.js';

dotenv.config();

test('getFile', async () => {
  const targetFile = '';
  const file = {
    url: 'https://ftp.ncbi.nlm.nih.gov/pubchem/Other/README.txt',
  };
  let result = await getFile(file, targetFile);
  expect(await result).toBe(200);
});
