import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';
import entries from '../routes/v1/entriesAdmin.js';

test('search (admin)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('compounds');
    if ((await collection.countDocuments()) === 12) {
      break;
    }
  }
  const request = {
    query: {
      collectionToSearch: 'compounds',
      limit: 10,
      fields: 'state,seq,dateStart,dateEnd,sources',
    },
  };

  const results = await entries.handler(request);
  // fix date values for test
  results.data[0].dateStart = 0;
  results.data[0].dateEnd = 1;
  expect(results.data).toMatchInlineSnapshot(`
    [
      {
        "_id": "compounds_progress",
        "dateEnd": 1,
        "dateStart": 0,
        "seq": 12,
        "sources": "../docker/src/plugins/compounds/sync/utils/__tests__/data/compoundsIncrementalTest.sdf.gz",
        "state": "updated",
      },
    ]
  `);
});
