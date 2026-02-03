import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { checkCoconutLink } from '../checkCoconutLink.js';

dotenv.config();
test('checkCoconutLink', async () => {
  const previousLink =
    'https://coconut.s3.uni-jena.de/prod/downloads/2026-02/coconut_csv-02-2026.zip';
  const connection = new OctoChemConnection();
  const result = await checkCoconutLink(previousLink, connection);
  expect(result).toMatchInlineSnapshot(`
    [
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-02/coconut_sdf_2d_lite-02-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-02/coconut_sdf_2d-02-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-02/coconut_sdf_3d-02-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-02/coconut-dump-02-2026.sql",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-02/coconut_csv_lite-02-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-02/coconut_csv-02-2026.zip",
    ]
  `);
  if (connection) {
    await connection.close();
  }
});
