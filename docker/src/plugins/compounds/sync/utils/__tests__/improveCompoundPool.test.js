import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import improveCompoundPool from '../improveCompoundPool';

dotenv.config();

test(
  'improveCompoundPool error',
  async () => {
    let molecule = {
      idCode:
        'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
    };

    let { promise } = await improveCompoundPool(molecule, { timeout: 1 });

    expect(await promise).toMatchInlineSnapshot('undefined');
  },
  { timeout: 30000 },
);
test(
  'improveCompoundPool working',
  async () => {
    let molecule = {
      idCode:
        'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
    };

    let { promise } = await improveCompoundPool(molecule, { timeout: 60000 });

    expect(await promise).toMatchInlineSnapshot(`
      {
        "data": {
          "atoms": {
            "C": 37,
            "H": 60,
            "O": 8,
          },
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
              -176155,
              -307601666,
              -1275154608,
              -1967272330,
              -104531155,
              2053882932,
              1199594955,
              -732785978,
              2019820188,
              -1526556927,
              302012420,
              -2147285629,
              134746113,
              812667200,
              536870976,
              134250500,
            ],
            "logP": 4.544999875128269,
            "logS": -5.477999992668629,
            "noStereoTautomerID": "ekTpA@@@LAEMGLn\\\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@",
            "polarSurfaceArea": 117.83999633789062,
            "rotatableBondCount": 8,
            "stereoCenterCount": 15,
          },
          "unsaturation": 8,
        },
      }
    `);
  },
  { timeout: 30000 },
);
