import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import { aggregate } from '../../aggregates/aggregateActivesOrNaturals';

test(
  'Aggregation ActivesOrNaturals',
  async () => {
    const connection = new OctoChemConnection();
    const lotusesCollection = await connection.getCollection('lotuses');
    const npassesCollection = await connection.getCollection('npasses');
    const npAtlasesCollection = await connection.getCollection('npAtlases');
    const cmaupsCollection = await connection.getCollection('cmaups');
    const coconutsCollection = await connection.getCollection('coconuts');
    const bioassaysCollection = await connection.getCollection('bioassays');
    const gnpsCollection = await connection.getCollection('gnps');
    const pubmedsCollection = await connection.getCollection('pubmeds');
    const patentsCollection = await connection.getCollection('patents');
    const compoundPatentsCollection = await connection.getCollection(
      'compoundPatents',
    );
    while (true) {
      if (
        (await lotusesCollection.countDocuments()) === 20 &&
        (await npassesCollection.countDocuments()) === 12 &&
        (await npAtlasesCollection.countDocuments()) === 3 &&
        (await cmaupsCollection.countDocuments()) === 19 &&
        (await coconutsCollection.countDocuments()) === 9 &&
        (await bioassaysCollection.countDocuments()) === 20 &&
        (await gnpsCollection.countDocuments()) === 2 &&
        (await pubmedsCollection.countDocuments()) === 7 &&
        (await patentsCollection.countDocuments()) === 255 &&
        (await compoundPatentsCollection.countDocuments()) === 4502
      ) {
        break;
      }
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
    if (result) {
      for (const molecule of result.data.molecules) {
        delete molecule.ocl.coordinates;
      }
      delete result.data.noStereoOCL.coordinates;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  },
  { timeout: 50000 },
);
