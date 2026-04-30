import { describe, it, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import entriesSearch from '../../routes/v1/search.js';

describe('search activesOrNaturals', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const activeOrNaturalsCollection =
      await connection.getCollection('activesOrNaturals');
    if ((await activeOrNaturalsCollection.countDocuments()) === 70) {
      break;
    }
  }
  it('search: em using limit', async () => {
    let request = {
      query: {
        em: '344.1623, 376.1647',
        precision: '100',
      },
    };
    const results = await entriesSearch.handler(request);

    request.query.limit = 1;
    const resultsTwo = await entriesSearch.handler(request);
    expect(results.data.length).toBeGreaterThan(resultsTwo.data.length);
    expect(results.data.length).toBeGreaterThan(0);
  });

  it('search: min max and flags', async () => {
    const request = {
      query: {
        minNbMassSpectra: 0,
        maxNbMassSpectra: 2,
        minNbActivities: 1,
        maxNbActivities: 2,
        minNbTaxonomies: 1,
        maxNbTaxonomies: 2,
        minNbPatents: 0,
        maxNbPatents: 2,
        minNbPubmeds: 0,
        maxNbPubmeds: 2,
        isNaturalProduct: true,
        fields: 'data.mf,data.em,data.taxonomies,data.activities',
      },
    };
    const results = await entriesSearch.handler(request);
    const resultsTwo = await entriesSearch.handler({
      query: { isBioactive: false },
    });
    expect(results.data.length).toBeGreaterThan(0);
    expect(resultsTwo.data.length).toBeGreaterThan(0);
    expect(results.data[0].data.em).toBeGreaterThan(0);
  });
  it('search: keywords ', async () => {
    const request = {
      query: {
        kwTaxonomies: 'rubiaceae',
        kwBioassays: 'ic50',
        fields:
          'data.kwTaxonomies,data.kwBioassays,data.kwActiveAgainst,data.kwMeshTerms',
      },
    };
    const results = await entriesSearch.handler(request);
    expect(results.data.length).toBeGreaterThan(0);
    expect(results.data[0].data.kwTaxonomies).toContain('rubiaceae');
    expect(results.data[0].data.kwBioassays).toContain('ic50');
  });
  it('search: mf ', async () => {
    const request = {
      query: {
        mf: 'C20H28O4',
        fields: 'data.mf,data.em',
      },
    };
    const results = await entriesSearch.handler(request);
    expect(results.data.length).toBeGreaterThan(0);
    expect(results.data[0].data.mf).toBe('C20H28O4');
  });
  it('search: noStereoTautomerID ', async () => {
    const request = {
      query: {
        noStereoTautomerID: 'f`~@P@@HiIImm[Ujjjjj`@upCDLHq~dLATq|L_C@',
        fields: 'data.mf,data.em',
      },
    };
    const results = await entriesSearch.handler(request);
    expect(results.data[0]).toMatchInlineSnapshot(`undefined`);
  });
  await connection.close();
});
