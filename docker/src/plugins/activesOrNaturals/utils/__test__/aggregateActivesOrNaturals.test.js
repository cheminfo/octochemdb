import delay from 'delay';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import { aggregate } from '../../aggregates/aggregateActivesOrNaturals';

test(
  'Aggregation ActivesOrNaturals',
  async () => {
    const connection = new OctoChemConnection();
    let colllectionList = await connection.getCollectionNames();
    while (
      !colllectionList.includes('lotuses') ||
      !colllectionList.includes('npasses') ||
      !colllectionList.includes('npAtlases') ||
      !colllectionList.includes('cmaups') ||
      !colllectionList.includes('coconuts') ||
      !colllectionList.includes('bioassays') ||
      !colllectionList.includes('gnps') ||
      !colllectionList.includes('pubmeds')
      //||
      //!colllectionList.includes('patents')
    ) {
      await delay(1000);
      colllectionList = await connection.getCollectionNames();
    }
    await aggregate(connection);
    const collection = await connection.getCollection('activesOrNaturals');
    const collectionEntry = await collection
      .find({
        _id: 'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
      })
      .limit(1);

    let result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    if (result?.data?.ocl?.coordinates) {
      delete result.data.ocl.coordinates;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  },
  { timeout: 100000 },
);
