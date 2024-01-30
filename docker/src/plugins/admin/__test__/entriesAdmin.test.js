import { describe, it, expect } from 'vitest';

import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';
import entries from '../routes/v1/entriesAdmin.js';

describe('search (admin)', async () => {
  it('search compounds', async () => {
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
      },
    };

    const results = await entries.handler(request);
    // fix date values for test
    results.data[0].dateStart = 0;
    results.data[0].dateEnd = 1;
    // remove storageSize and freeStorageSize for test
    delete results.data[0].storageSize;
    delete results.data[0].freeStorageSize;
    expect(results.data).toMatchInlineSnapshot(`
      [
        {
          "_id": "compounds_progress",
          "avgObjSize": 18287,
          "capped": false,
          "count": 12,
          "dateEnd": 1,
          "dateStart": 0,
          "ns": "octochemdb.compounds",
          "seq": 12,
          "size": 219445,
          "sources": "../docker/src/plugins/compounds/sync/utils/__tests__/data/compoundsIncrementalTest.sdf.gz",
          "state": "updated",
        },
      ]
    `);
  });
});
