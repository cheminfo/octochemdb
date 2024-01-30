import { describe, it, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import entriesSearch from '../../routes/v1/search.js';

describe('search activesOrNaturals', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const activeOrNaturalsCollection =
      await connection.getCollection('activesOrNaturals');
    if ((await activeOrNaturalsCollection.countDocuments()) === 63) {
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

    request.query.limit = 2;
    const resultsTwo = await entriesSearch.handler(request);
    expect(results.data.length).toBeGreaterThan(resultsTwo.data.length);
    const resultToMatch = results.data.filter(
      (entry) =>
        entry._id ===
        'fi{AP@@QrtZTjjsJk]jxHyHRuUUUUUUUU@AjxVIXUcVCXmavOXccNJx{b^ExQFMkX~FOaaul_CGpp',
    )[0];
    expect(resultToMatch).toMatchInlineSnapshot(`
      {
        "_id": "fi{AP@@QrtZTjjsJk]jxHyHRuUUUUUUUU@AjxVIXUcVCXmavOXccNJx{b^ExQFMkX~FOaaul_CGpp",
        "data": {
          "em": 344.16237387137,
          "mf": "C20H24O5",
        },
      }
    `);
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
    expect(resultsTwo.data.length).toBeLessThan(results.data.length);
    const resultToMatch = results.data.filter(
      (entry) =>
        entry._id ===
        'ehZPL@@@KglbbdRebTLRdJttTTRxDLlbRZzv~jjjjjjjjjjjjP@MTClWXRCKjfOacxX',
    )[0];
    expect(resultToMatch).toMatchSnapshot();
  });
  it('search: keywords ', async () => {
    const request = {
      query: {
        kwTaxonomies: 'viridiplantae',
        kwBioassays: 'inhibitors',
        kwActiveAgainst: 'borrarchaeaceae',
        fields:
          'data.kwTaxonomies,data.kwBioassays,data.kwActiveAgainst,data.kwMeshTerms',
      },
    };
    const results = await entriesSearch.handler(request);
    expect(results.data[0].data).toMatchInlineSnapshot(`
      {
        "kwActiveAgainst": [
          "archaea",
          "borrarchaeaceae",
          "borrarchaeales",
          "borrarchaeia",
          "borrarchaeota",
          "borrarchaeum",
          "candidatus",
        ],
        "kwBioassays": [
          "eukaryotic",
          "inhibitors",
          "initiation",
          "molecule",
          "small",
          "translation",
          "uhts",
        ],
        "kwTaxonomies": [
          "viridiplantae",
          "streptophyta",
          "magnoliopsida",
          "cucurbitaceae",
          "momordica",
          "charantia",
        ],
      }
    `);
  });
  it('search: mf ', async () => {
    const request = {
      query: {
        mf: 'C20H28O4',
        fields: 'data.mf,data.em',
      },
    };
    const results = await entriesSearch.handler(request);
    expect(results.data[0]).toMatchInlineSnapshot(`
      {
        "_id": "fak@P@@RuGIEDdeELieEKCbgEAsSMUUUUUUP@ZdCbNBx[c}HYFecxX~F@",
        "data": {
          "em": 332.19875938072,
          "mf": "C20H28O4",
        },
      }
    `);
  });
  it('search: noStereoTautomerID ', async () => {
    const request = {
      query: {
        noStereoTautomerID: 'f`~@P@@HiIImm[Ujjjjj`@upCDLHq~dLATq|L_C@',
        fields: 'data.mf,data.em',
      },
    };
    const results = await entriesSearch.handler(request);
    expect(results.data[0]).toMatchInlineSnapshot(`
      {
        "_id": "f\`~@P@@HiIImm[Ujjjjj\`@upCDLHq~dLATq|L_C@",
        "data": {
          "em": 232.16745925179998,
          "mf": "C12H24O4",
        },
      }
    `);
  });
});
