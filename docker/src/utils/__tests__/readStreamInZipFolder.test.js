import { bsonIterator } from 'bson-iterator';
import { fileCollectionFromPath } from 'filelist-utils';
import { test, expect } from 'vitest';

import readStreamInZipFolder from '../readStreamInZipFolder';

test('readStreamInZipFolder', async () => {
  let path = `../docker/src/utils/__tests__/data/`;

  const fileToRead = (
    await fileCollectionFromPath(`${path}`, { unzip: { zipExtensions: [] } })
  ).files.sort((a, b) => b.lastModified - a.lastModified)[0];
  fileToRead.relativePath = path.replace('data/', fileToRead.relativePath);
  const readStream = await readStreamInZipFolder(
    fileToRead.relativePath,
    'testCoconut.bson',
  );
  let result = [];
  for await (const entry of bsonIterator(readStream)) {
    result.push(entry);
  }
  expect(result).toMatchSnapshot();
});
