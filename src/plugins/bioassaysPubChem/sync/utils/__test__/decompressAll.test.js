import { rmSync } from 'node:fs';
import { join } from 'node:path';

import { fileCollectionFromPath } from 'filelist-utils';
import { expect, test } from 'vitest';

import { decompressAll } from '../decompressAll.js';

test.skip('(decompressAll): unzip and ungzip', async () => {
  let fileList = await fileCollectionFromPath(join(__dirname, 'data'), {
    unzip: { zipExtensions: [] },
    ungzip: { gzipExtensions: [] },
  });

  const file = fileList.files.find(
    (file) => file.name === 'testDecompressAll.zip',
  );
  const result = await decompressAll(join(__dirname, file.relativePath));

  expect(result).toHaveLength(1000);

  rmSync(join(__dirname, file.relativePath.replace('.zip', '')), {
    recursive: true,
  });
});
