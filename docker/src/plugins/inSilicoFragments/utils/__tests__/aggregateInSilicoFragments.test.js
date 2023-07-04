import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import { aggregate } from '../../aggregates/aggregate';

test(
  'Aggregation ActivesOrNaturals',
  async () => {
    const connection = new OctoChemConnection();
    const activesOrNaturalsCollection = await connection.getCollection(
      'activesOrNaturals',
    );

    while (true) {
      if ((await activesOrNaturalsCollection.countDocuments()) === 20) {
        break;
      }
    }

    await aggregate(connection);
    const collection = await connection.getCollection('inSilicoFragments');
    const collectionEntry = await collection
      .find({
        _id: 'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
      })
      .limit(1);

    let result = await collectionEntry.next();

    expect(result).toMatchSnapshot();
    await connection.close();
  },
  { timeout: 50000 },
);
