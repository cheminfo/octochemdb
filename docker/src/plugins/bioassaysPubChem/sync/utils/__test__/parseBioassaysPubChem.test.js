//testParseBioassaysPubChem
import { readFileSync } from 'fs';
import { join } from 'path';

import { fileCollectionFromPath } from 'filelist-utils';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { parseBioassaysPubChem } from '../parseBioassaysPubChem.js';

test.skip('ParseBioassaysPubChem', async () => {
  const connection = new OctoChemConnection();
  let fileList = await fileCollectionFromPath(join(__dirname, 'data'), {
    unzip: { zipExtensions: [] },
    ungzip: { gzipExtensions: [] },
  });

  const file = fileList.files.filter(
    (file) => file.name === 'testParseBioassaysPubChem.json',
  )[0];
  const data = readFileSync(join(__dirname, file.relativePath), 'utf8');
  const json = JSON.parse(data);
  const result = await parseBioassaysPubChem(json, connection);
  expect(result).toMatchSnapshot();
});
