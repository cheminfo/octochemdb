import dotenv from 'dotenv';
import { expect, test } from 'vitest';

import getFile from '../getFile.js';

dotenv.config();

test('getFile', async () => {
  const targetFile = '';
  const file = {
    url: 'https://ftp.ncbi.nlm.nih.gov/pubchem/Other/README.txt',
  };
  const result = await getFile(file, targetFile);

  expect(result).toBe(200);
});
