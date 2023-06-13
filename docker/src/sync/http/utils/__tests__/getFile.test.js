import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import getFile from '../getFile.js';

dotenv.config();

test(
  'getFile',
  async () => {
    const targetFile = '';
    const file = {
      url: process.env.GETFILEIFNEW_SOURCE_TEST,
    };
    let result = await getFile(file, targetFile);
    expect(await result).toBe(200);
  },
  { timeout: 30000 },
);
