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
        "coordinates": "!BkDKv^?DDiHVdaYL}kDJlPoY{}gn[noDDiHVdaZqB^?D}kFslwoaF_zREQJYxN\\\\KL?Fr\\\\DfQAaLg|{OIKcTodY^s|aMXt|cSu?o\`t|o{xMOTt|cSrMOW~~@",
        "idCode": "ekTpA@@@LAEMGLn\\\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@",
        "noStereoTautomerID": "ekTpA@@@LAEMGLn\\\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@",
      },
      "unsaturation": 8,
    }
  `);
}, 10000);
