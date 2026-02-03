import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import syncFolder from '../syncFolder';

dotenv.config();

test('syncFolder', async () => {
  const destination = '../docker/src/sync/http/utils/__tests__/data/';

  const source = `https://ftp.ncbi.nlm.nih.gov/pubchem/Compound/CURRENT-Full/SDF/`;
  const { allFiles } = await syncFolder(source, destination, {
    fileFilter: (file) => file && file.name.endsWith('.gz'),
  });
  let result = [];
  for (const file of allFiles) {
    result.push(file.name);
  }
  expect(result.length).toBeGreaterThan(0);
});
