import { rmSync } from 'fs';
import { join } from 'path';

import { fileCollectionFromPath } from 'filelist-utils';
import { test, expect } from 'vitest';

import { decompressAll } from '../decompressAll.js';

test('(decompressAll): unzip and ungzip', async () => {
  let fileList = await fileCollectionFromPath(join(__dirname, 'data'), {
    unzip: { zipExtensions: [] },
    ungzip: { gzipExtensions: [] },
  });

  const file = fileList.files.filter(
    (file) => file.name === 'testDecompressAll.zip',
  )[0];
  const result = await decompressAll(join(__dirname, file.relativePath));
  expect(result).toHaveLength(1000);
  rmSync(join(__dirname, file.relativePath.replace('.zip', '')), {
    recursive: true,
  });
});
