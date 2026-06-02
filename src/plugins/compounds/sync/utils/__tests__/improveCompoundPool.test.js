import dotenv from 'dotenv';
import { expect, test } from 'vitest';

import improveCompoundPool from '../improveCompoundPool';

dotenv.config();

const SMALL_MOLECULE = { smiles: 'CCO' };
const swallow = () => undefined;

test('improveCompoundPool applies backpressure on pending downstream work', async () => {
  // In test mode nbCPU is forced to 1, so the threshold is 1 * 5 = 5,
  // meaning the pool allows up to 5 in-flight resolutions before blocking
  // the next acquire. Acquiring 6 without releasing exhausts the budget;
  // the 7th call must block until a slot is released via `done()`.
  const acquired = [];
  for (let i = 0; i < 6; i++) {
    acquired.push(await improveCompoundPool(SMALL_MOLECULE));
  }

  let nextAcquired = false;
  const nextPromise = improveCompoundPool(SMALL_MOLECULE).then((handle) => {
    nextAcquired = true;
    return handle;
  });

  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });

  expect(nextAcquired).toBe(false);

  acquired[0].done();
  const next = await nextPromise;

  expect(nextAcquired).toBe(true);

  for (let i = 1; i < acquired.length; i++) acquired[i].done();
  next.done();
  await Promise.all([
    ...acquired.map((h) => h.promise.catch(swallow)),
    next.promise.catch(swallow),
  ]);
});

test('improveCompoundPool error', async () => {
  let molecule = {
    idCode: String.raw`ekTpA@@@LAEMGLn\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@`,
  };

  let { promise, done } = await improveCompoundPool(molecule, { timeout: 1 });

  await expect(promise).resolves.toMatchInlineSnapshot('undefined');

  done();
});

test('improveCompoundPool working', async () => {
  let molecule = {
    idCode: String.raw`ekTpA@@@LAEMGLn\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@`,
  };

  let { promise, done } = await improveCompoundPool(molecule, {
    timeout: 60000,
  });
  const result = await promise;
  if (result?.data?.ocl) {
    delete result.data.ocl.coordinates;
  }
  done();

  await expect(promise).resolves.toMatchInlineSnapshot(String.raw`
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
          "donorCount": 4,
          "idCode": "ekTpA@@@LAEMGLn\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@",
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
          "noStereoTautomerID": "ekTpA@@@LAEMGLn\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@",
          "polarSurfaceArea": 117.83999633789062,
          "rotatableBondCount": 8,
          "stereoCenterCount": 15,
        },
        "unsaturation": 8,
      },
    }
  `);
});
