import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import { checkIfUpdate } from '../checkIfUpdate';

dotenv.config();
test('checkIfUpdate', async () => {
  const previousLink =
    'https://coconut.s3.uni-jena.de/prod/downloads/2025-05/coconut_csv-05-2025.zip';
  const connection = 'test';
  const result = await checkIfUpdate(previousLink, connection);
  expect(result).toHaveProperty('updateAvailable');
  expect(result).toHaveProperty('newLink');
});
