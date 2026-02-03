import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { checkNpAtlasesLink } from '../checkNpAtlasesLink.js';

dotenv.config();
test('checkNpAtlasesLink', async () => {
  const previousLinks = [
    'https://www.npatlas.org/static/downloads/NPAtlas_download.json',
  ];
  const connection = new OctoChemConnection();
  const result = await checkNpAtlasesLink(previousLinks, connection);
  expect(result).toMatchInlineSnapshot(`
    [
      "https://www.npatlas.org/download",
      "https://www.npatlas.org/static/downloads/NPAtlas_download.tsv",
      "https://www.npatlas.org/static/downloads/NPAtlas_download.xlsx",
      "https://www.npatlas.org/static/downloads/NPAtlas_download.json",
      "https://www.npatlas.org/static/downloads/NPAtlas_download.sdf",
      "https://www.npatlas.org/static/downloads/NPAtlas_download_networks.zip",
      "https://www.npatlas.org/static/img/Atlas_logo_highres.png",
      "https://www.npatlas.org/download",
    ]
  `);
  if (connection) {
    await connection.close();
  }
});
