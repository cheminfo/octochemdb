import 'dotenv/config';
import { test, expect } from 'vitest';

import getFile from '../getFile.js';

test('getFile', async () => {
  const targetFile = '';
  const file = {
    url: process.env.GETFILEIFNEW_SOURCE_TEST,
  };
  let result = await getFile(file, targetFile);
  expect(await result).toBe(200);
}, 10000);
