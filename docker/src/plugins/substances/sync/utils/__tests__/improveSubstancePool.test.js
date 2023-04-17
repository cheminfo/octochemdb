import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import improveSubstancePool from '../improveSubstancePool';

dotenv.config();

test('improveSubstancePool error', async () => {
  let molecule = {
    idCode:
      'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
  };

  let { promise } = await improveSubstancePool(molecule, { timeout: 1 });

  expect(await promise).toMatchInlineSnapshot('undefined');
}, 10000);
test('improveSubstancePool working', async () => {
  let molecule = {
    idCode:
      'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
  };

  let { promise } = await improveSubstancePool(molecule, { timeout: 60000 });
  const result = await promise;
  expect(result.data).toMatchInlineSnapshot(`
    {
      "atom": "{\\"C\\":37,\\"H\\":60,\\"O\\":8}",
      "charge": 0,
      "em": 632.42881889036,
      "mf": "C37H60O8",
      "mw": 632.868912817097,
      "nbFragments": 1,
      "ocl": {
        "acceptorCount": 8,
        "coordinates": "!BkDKv^?DDiHVdaYL}kDJlPoY{}gn[noDDiHVdaZqB^?D}kFslwoaF_zREQJYxN\\\\KL?Fr\\\\DfQAaLg|{OIKcTodY^s|aMXt|cSu?o\`t|o{xMOTt|cSrMOW~~@",
        "donorCount": 4,
        "idCode": "ekTpA@@@LAEMGLn\\\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@",
        "index": [
          229,
          79,
          253,
          255,
          254,
          94,
          170,
          237,
          80,
          175,
          254,
          179,
          118,
          206,
          189,
          138,
          45,
          251,
          196,
          249,
          52,
          196,
          107,
          122,
          203,
          93,
          128,
          71,
          198,
          146,
          82,
          212,
          156,
          2,
          100,
          120,
          1,
          151,
          2,
          165,
          4,
          88,
          0,
          18,
          131,
          5,
          3,
          128,
          1,
          16,
          8,
          8,
          64,
          81,
          112,
          48,
          64,
          0,
          0,
          32,
          4,
          128,
          0,
          8,
        ],
        "logP": 4.544999875128269,
        "logS": -5.477999992668629,
        "noStereoID": "ekTpA@@BKBiod\\\\Q\\\\ddTbTRaURTTfbTVfQratRTdtd\\\\TLRjV^vnjjfjjjjjjjjjjfjjh@@L@",
        "noStereoTautomerID": "ekTpA@@@LAEMGLn\\\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@",
        "polarSurfaceArea": 117.83999633789062,
        "rotatableBondCount": 8,
        "stereoCenterCount": 15,
      },
      "unsaturation": 8,
    }
  `);
}, 10000);
