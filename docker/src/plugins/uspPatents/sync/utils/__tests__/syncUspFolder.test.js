import 'dotenv/config';
import { test, expect } from 'vitest';

import syncUspFolder from '../http/syncUspFolder';

test('syncUSPFolder 2001', async () => {
  const destination = './data/';

  const source = `${process.env.USP_SOURCE}`;
  const year = '2001';
  let filesDownloaded = await syncUspFolder(source, destination, year);
  expect(filesDownloaded.length).toBeGreaterThan(0);
  expect(filesDownloaded).toMatchSnapshot();
}, 100000);
