import dotenv from 'dotenv';
import { expect, test } from 'vitest';

import improveSubstancePool from '../improveSubstancePool';

dotenv.config();

test('improveSubstancePool applies backpressure on pending downstream work', async () => {
  // In test mode nbCPU is forced to 1, so the threshold is 1 * 5 = 5.
  // Acquiring 6 without releasing exhausts the budget; the next call must
  // block until a slot is released via `done()`.
  const small = { smiles: 'CCO' };
  const acquired = [];
  for (let i = 0; i < 6; i++) {
    acquired.push(await improveSubstancePool(small));
  }

  let nextAcquired = false;
  const nextPromise = improveSubstancePool(small).then((handle) => {
    nextAcquired = true;
    return handle;
  });

  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(nextAcquired).toBe(false);

  acquired[0].done();
  const next = await nextPromise;
  expect(nextAcquired).toBe(true);

  for (let i = 1; i < acquired.length; i++) acquired[i].done();
  next.done();
  await Promise.all([
    ...acquired.map((h) => h.promise.catch(() => {})),
    next.promise.catch(() => {}),
  ]);
});

test('improveSubstancePool error', async () => {
  let molecule = {
    idCode: String.raw`ekTpA@@@LAEMGLn\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@`,
  };

  let { promise, done } = await improveSubstancePool(molecule, { timeout: 1 });

  await expect(promise).resolves.toMatchInlineSnapshot('undefined');
  done();
});

test('improveSubstancePool working', async () => {
  let molecule = {
    idCode: String.raw`ekTpA@@@LAEMGLn\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@`,
  };

  let { promise, done } = await improveSubstancePool(molecule, { timeout: 60000 });
  const result = await promise;
  done();

  expect(result.data).toMatchInlineSnapshot(`
    {
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
        "coordinates": "!BkDKv^?DDiHVdaYL}kDJlPoY{}gn[noDDiHVdaZqB^?D}kFslwoaF_zREQJYxN\\KL?Fr\\DfQAaLg|{OIKcTodY^s|aMXt|cSu?o\`t|o{xMOTt|cSrMOW~~@",
        "idCode": "ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@",
        "noStereoTautomerID": "ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@",
      },
      "unsaturation": 8,
    }
  `);
});
