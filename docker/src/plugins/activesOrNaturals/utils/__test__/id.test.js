import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import entriesFromID from '../../routes/v1/id.js';

test('id search (activesOrNaturals)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const activeOrNaturalsCollection =
      await connection.getCollection('activesOrNaturals');
    if ((await activeOrNaturalsCollection.countDocuments()) === 70) {
      break;
    }
  }
  const request = {
    query: {
      id: 'fmoaP@C@iEltinU]e^][_dcNBfoZBBJjjjjjJ`@ue{@\\QpgF\\EpwA|Wq~dLcQq|L_C@',
      fields: 'data',
    },
  };
  const results = await entriesFromID.handler(request);

  expect('data' in results).toBe(true);
  if (!('data' in results)) throw new Error('Expected data in results');
  const /** @type {any} */ data = results.data;
  for (const noStereo of data.data.noStereoOCL) {
    delete noStereo.coordinates;
  }
  for (const molecule of data.data.molecules) {
    delete molecule.ocl.coordinates;
  }
  expect(data).toMatchSnapshot();
  await connection.close();
});
