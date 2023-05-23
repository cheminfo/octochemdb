import delay from 'delay';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import { getMeshTerms } from '../getMeshTerms.js';

test(
  'Aggregation ActivesOrNaturals',
  async () => {
    const connection = new OctoChemConnection();
    let colllectionList = await connection.getCollectionNames();
    while (
      !colllectionList.includes('pubmeds') &&
      !colllectionList.includes('activesOrNaturals')
    ) {
      await delay(1000);
      colllectionList = await connection.getCollectionNames();
    }
    const collection = await connection.getCollection('pubmeds');
    await collection.updateMany(
      {},
      {
        $set: {
          'data.compounds': [
            { $ref: 'compounds', $id: 19342306 },
            { $ref: 'compounds', $id: 19342308 },
          ],
        },
      },
    );
    let cids = [
      { $ref: 'compounds', $id: 19342306 },
      { $ref: 'compounds', $id: 19342308 },
    ];

    let result = await getMeshTerms(cids, collection, connection);

    expect(result).toMatchSnapshot();
    await connection.close();
  },
  { timeout: 100000 },
);
