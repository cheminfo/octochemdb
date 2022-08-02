import { getMassSpectraRef } from '../getMassSpectraRef.js';

import 'dotenv/config';

import { PubChemConnection } from '../../../../utils/PubChemConnection.js';

test('syncTaxonomies', async () => {
  const connection = new PubChemConnection();
  const result = await getMassSpectraRef(
    connection,
    'gfOEPX@@DE@qTzJmPy}~@ZKARx|aXbTjL^rJIQQSSPyQJISJIQPpqSPsPiIIZIYQJZXqIVgQFbuSULuUMUUMSMUMULtuUUM@A@@@@',
  );
  expect(result).toHaveLength(1);
}, 5000);
