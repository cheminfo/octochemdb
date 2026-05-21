import dotenv from 'dotenv';
import { expect, test } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { checkMassBankLink } from '../checkMassBankLink.js';

dotenv.config();

test('checkMassBankLink', async () => {
  const previousLink =
    'https://github.com/MassBank/MassBank-data/releases/download/2025.10/MassBank_NISTformat.msp';
  const connection = new OctoChemConnection();
  const result = await checkMassBankLink(previousLink, connection);

  expect(result).toMatchInlineSnapshot(`
    [
      "https://github.com/MassBank/MassBank-data/releases/download/2026.03/MassBank.json",
      "https://github.com/MassBank/MassBank-data/releases/download/2026.03/MassBank_NISTformat.msp",
      "https://github.com/MassBank/MassBank-data/releases/download/2026.03/MassBank_RIKENformat.msp",
      "https://github.com/MassBank/MassBank-data/archive/refs/tags/2026.03.zip",
      "https://github.com/MassBank/MassBank-data/archive/refs/tags/2026.03.tar.gz",
    ]
  `);

  await connection.close();
});
