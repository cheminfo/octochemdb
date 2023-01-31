import { join } from 'path';

import { bsonIterator } from 'bson-iterator';

import readStreamInZipFolder from '../readStreamInZipFolder';

test('readStreamInZipFolder', async () => {
  const pathToZipFile = join(__dirname, 'data/testCoconut.bson.zip');
  const readStream = await readStreamInZipFolder(
    pathToZipFile,
    'testCoconut.bson',
  );
  let result = [];
  for await (const entry of bsonIterator(readStream)) {
    result.push(entry);
  }
  expect(result).toMatchSnapshot();
});
