import { bsonIterator } from 'bson-iterator';
import { fileCollectionFromPath } from 'filelist-utils';
import { test, expect } from 'vitest';

import readStreamInZipFolder from '../readStreamInZipFolder';

test('readStreamInZipFolder', async () => {
  let path = `../docker/src/utils/__tests__/data/`;

  const fileToRead = (await fileCollectionFromPath(`${path}`)).files.filter(
    (file) => {
      return (
        file.relativePath.includes('zip') && file.name === 'testCoconut.bson'
      );
    },
  )[0];
  fileToRead.relativePath = path.replace('data/', fileToRead.relativePath);
  const readStream = await readStreamInZipFolder(fileToRead);
  let result = [];
  for await (const entry of bsonIterator(readStream)) {
    result.push(entry);
  }
  expect(result).toMatchSnapshot();
});
