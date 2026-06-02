import dotenv from 'dotenv';
import OCL from 'openchemlib';
import { expect, test } from 'vitest';

import {
  computeNoStereosLocally,
  getNoStereosFromCache,
} from '../getNoStereosFromCache.js';

dotenv.config();

test('getNoStereosFromCache returns expected shape', async () => {
  const oclMolecule = OCL.Molecule.fromSmiles('CCOc1ccccc1N');
  const result = await getNoStereosFromCache(oclMolecule);
  delete result.coordinates;

  expect(result).toMatchSnapshot();
});

test('local fallback matches cache output', async () => {
  // Confirms the local computation of noStereoTautomerID matches what
  // the cache returns, so substances and other consumers receive the
  // same value whether the cache is reachable or not.
  const oclMolecule = OCL.Molecule.fromSmiles('CCOc1ccccc1N');
  const oclID = oclMolecule.getIDCodeAndCoordinates();

  const cacheResult = await getNoStereosFromCache(oclMolecule);
  const localResult = computeNoStereosLocally(oclMolecule, oclID);

  delete cacheResult.coordinates;
  delete localResult.coordinates;

  expect(localResult).toStrictEqual(cacheResult);
});
