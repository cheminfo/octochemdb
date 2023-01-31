import { PubChemConnection } from '../../../../utils/PubChemConnection.js';
import { getMassSpectraRef } from '../getMassSpectraRef.js';

test('syncTaxonomies', async () => {
  const connection = new PubChemConnection();
  const result = await getMassSpectraRef(
    connection,
    'gfOEPX@@DE@qTzJmPy}~@ZKARx|aXbTjL^rJIQQSSPyQJISJIQPpqSPsPiIIZIYQJZXqIVgQFbuSULuUMUUMSMUMULtuUUM@A@@@@',
  );
  expect(result).toHaveLength(1);
}, 5000);
