import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { checkGNPSLink } from '../checkGNPSLink.js';

dotenv.config();
test('checkGNPSLink', async () => {
  const previousLinks = [
    'https://external.gnps2.org/gnpslibrary/ALL_GNPS_NO_PROPOGATED.json',
  ];
  const connection = new OctoChemConnection();
  const result = await checkGNPSLink(previousLinks, connection);
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
