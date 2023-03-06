import 'dotenv/config';
import { test, expect } from 'vitest';

import getFileIfNew from '../getFileIfNew';

test('getFileIfNew', async () => {
  const destination = '../docker/src/sync/http/utils/__tests__/';
  const fileName = 'testResult';
  const extension = 'txt';
  const options = {
    filename: fileName,
    extension,
  };

  // transform file path to url import.meta.url
  const file = {
    url: process.env.GETFILEIFNEW_SOURCE_TEST,
  };

  const result = await getFileIfNew(file, destination, options);
  // search regex testResult
  const regex = new RegExp(fileName, 'g');
  const found = result.match(regex);
  expect(found).toHaveLength(1);
}, 10000);
