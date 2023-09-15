import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import activeAgainst from '../../routes/v1/activeAgainst.js';

test('getAll (activeAgainst)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('activeAgainst');
    if ((await collection.countDocuments()) === 1) {
      break;
    }
  }

  const results = await activeAgainst.handler();
  expect(results.data).toMatchInlineSnapshot(`
    [
      {
        "_id": "ArchaeaCandidatusBorrarchaeotaCandidatusBorrarchaeiaCandidatusBorrarchaealesCandidatusBorrarchaeaceaeCandidatusBorrarchaeum",
        "count": 20,
        "data": {
          "class": "Candidatus Borrarchaeia",
          "family": "Candidatus Borrarchaeaceae",
          "genus": "Candidatus Borrarchaeum",
          "order": "Candidatus Borrarchaeales",
          "phylum": "Candidatus Borrarchaeota",
          "superkingdom": "Archaea",
        },
      },
    ]
  `);
});
