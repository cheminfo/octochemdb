import dotenv from 'dotenv';
import OCL from 'openchemlib';
import { expect, test } from 'vitest';

import {
  computeSubstanceDataLocally,
  getSubstanceData,
} from '../getSubstanceData';

dotenv.config();

test('getSubstanceData returns expected shape', async () => {
  const molecule = {
    idCode: String.raw`ekTpA@@@LAEMGLn\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@`,
  };
  const result = await getSubstanceData(molecule);
  delete result.data.ocl.coordinates;

  expect(result).toMatchSnapshot();
});

test('local fallback matches cache output for the same substance', async () => {
  // Verifies that when ocl-cache is unreachable, the local computation
  // produces the same data shape and values as the cache would.
  const smiles = 'CCOc1ccccc1N';
  const oclMolecule = OCL.Molecule.fromSmiles(smiles);
  const oclID = oclMolecule.getIDCodeAndCoordinates();

  const cacheResult = await getSubstanceData({
    molfile: oclMolecule.toMolfile(),
  });
  const localResult = computeSubstanceDataLocally(oclMolecule, oclID);

  delete cacheResult.data.ocl.coordinates;
  delete localResult.data.ocl.coordinates;

  expect(localResult).toEqual(cacheResult);
});
