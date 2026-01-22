import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { checkCoconutLink } from '../checkCoconutLink.js';

dotenv.config();
test('checkCoconutLink', async () => {
  const previousLink = process.env.COCONUT_SOURCE;
  const connection = new OctoChemConnection();
  const result = await checkCoconutLink(previousLink, connection);
  expect(result).toMatchInlineSnapshot(`
    [
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-01/coconut_sdf_2d_lite-01-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-01/coconut_sdf_2d-01-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-01/coconut_sdf_3d-01-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-01/coconut-dump-01-2026.sql",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-01/coconut_csv_lite-01-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-01/coconut_csv-01-2026.zip",
    ]
  `);
  if (connection) {
    await connection.close();
  }
});
