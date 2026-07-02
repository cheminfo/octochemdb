import dotenv from 'dotenv';
import { expect, test } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { checkCoconutLink } from '../checkCoconutLink.js';

dotenv.config({ quiet: true });

test('checkCoconutLink', async () => {
  const previousLink =
    'https://coconut.s3.uni-jena.de/prod/downloads/2026-02/coconut_csv-02-2026.zip';
  const connection = new OctoChemConnection();
  const result = await checkCoconutLink(previousLink, connection);

  expect(result).toMatchInlineSnapshot(`
    [
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-07/coconut_sdf_2d_lite-07-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-07/coconut_sdf_2d-07-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-07/coconut_sdf_3d-07-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-07/coconut-dump-07-2026.sql",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-07/coconut_csv_lite-07-2026.zip",
      "https://coconut.s3.uni-jena.de/prod/downloads/2026-07/coconut_csv-07-2026.zip",
    ]
  `);

  await connection.close();
});
