import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import { aggregate } from '../../aggregates/aggregateActivesOrNaturals';

test('Aggregation ActivesOrNaturals', async () => {
  const connection = new OctoChemConnection();
  const lotusesV2Collection = await connection.getCollection('lotusesV2');
  const npassesCollection = await connection.getCollection('npasses');
  const npAtlasesCollection = await connection.getCollection('npAtlases');
  const cmaupsCollection = await connection.getCollection('cmaups');
  const coconutsCollection = await connection.getCollection('coconuts');
  const bioassaysCollection = await connection.getCollection('bioassays');
  const gnpsCollection = await connection.getCollection('gnps');
  const pubmedsCollection = await connection.getCollection('pubmeds');
  const patentsCollection = await connection.getCollection('patents');
  const titleCompoundsCollection =
    await connection.getCollection('titleCompounds');
  const compoundPatentsCollection =
    await connection.getCollection('compoundPatents');
  const requiredCollections = [
    'lotusesV2',
    'npasses',
    'npAtlases',
    'cmaups',
    'coconuts',
    'bioassays',
    'gnps',
    'pubmeds',
    'patents',
    'titleCompounds',
    'compoundPatents',
  ];
  const /** @type {Record<string, number>} */ expectedCounts = {
      lotusesV2: 20,
      npasses: 6,
      npAtlases: 3,
      cmaups: 19,
      coconuts: 20,
      bioassays: 20,
      gnps: 2,
      pubmeds: 7,
      patents: 255,
      titleCompounds: 10000,
      compoundPatents: 4502,
    };
  const adminCollection = await connection.getCollection('admin');

  while (true) {
    let allUpdated = true;
    const /** @type {Record<string, string | undefined>} */ states = {};
    for (const name of requiredCollections) {
      const progress = await adminCollection.findOne({
        _id: `${name}_progress`,
      });
      states[name] = progress?.state;
      if (progress?.state !== 'updated') {
        allUpdated = false;
      }
    }
    if (allUpdated) {
      // Also verify counts to be safe
      const collections = {
        lotusesV2: lotusesV2Collection,
        npasses: npassesCollection,
        npAtlases: npAtlasesCollection,
        cmaups: cmaupsCollection,
        coconuts: coconutsCollection,
        bioassays: bioassaysCollection,
        gnps: gnpsCollection,
        pubmeds: pubmedsCollection,
        patents: patentsCollection,
        titleCompounds: titleCompoundsCollection,
        compoundPatents: compoundPatentsCollection,
      };
      let countsMatch = true;
      for (const [name, col] of Object.entries(collections)) {
        const count = await col.countDocuments();
        if (count !== expectedCounts[name]) {
          countsMatch = false;
          break;
        }
      }
      if (countsMatch) break;
    }
  }

  await aggregate(connection);
  const collection = await connection.getCollection('activesOrNaturals');
  const collectionEntry = await collection
    .find({
      _id: 'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
    })
    .limit(1);

  let /** @type {any} */ result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  if (result) {
    for (const molecule of result.data.molecules) {
      delete molecule.ocl.coordinates;
    }
    delete result.data.noStereoOCL.coordinates;
    for (const noStereo of result.data.noStereoOCL) {
      delete noStereo.coordinates;
    }
  }
  expect(result).toMatchSnapshot();
  await connection.close();
});
