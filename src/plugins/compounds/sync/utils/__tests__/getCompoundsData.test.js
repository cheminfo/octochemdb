import dotenv from 'dotenv';
import OCL from 'openchemlib';
import { expect, test } from 'vitest';

import {
  computeCompoundsDataLocally,
  getCompoundsData,
} from '../getCompoundsData';

dotenv.config();

test('getCompoundsData', async () => {
  let molecule = {
    idCode: String.raw`ekTpA@@@LAEMGLn\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@`,
  };
  let dataCompound = await getCompoundsData(molecule);
  if (dataCompound?.data?.ocl) {
    // @ts-ignore
    delete dataCompound.data.ocl.coordinates;
  }

  expect(dataCompound).toMatchSnapshot();
});

test('getCompoundData test if index are correct', async () => {
  let molecule = {
    smiles: 'CCOCC',
  };
  let dataCompound = await getCompoundsData(molecule);
  if (dataCompound?.data?.ocl) {
    // @ts-ignore
    delete dataCompound.data.ocl.coordinates;
  }

  expect(dataCompound).toMatchSnapshot();
});

test('local fallback matches cache output for the same molecule', async () => {
  // The local-compute path is what runs when ocl-cache is unreachable.
  // It must produce the same result as the cache so downstream features
  // (substructure search, mass-bank matching, etc.) are not degraded.
  const smiles = 'CCOc1ccccc1N';
  const oclMolecule = OCL.Molecule.fromSmiles(smiles);
  const oclID = oclMolecule.getIDCodeAndCoordinates();

  const cacheResult = await getCompoundsData({ smiles });
  const localResult = computeCompoundsDataLocally(oclMolecule, oclID, {
    indexRequired: true,
  });

  // Coordinates can differ if the cache and our OCL build disagree on layout;
  // they are not part of the cache's canonical output. Drop them on both sides.
  delete cacheResult.data.ocl.coordinates;
  delete localResult.data.ocl.coordinates;

  expect(localResult).toStrictEqual(cacheResult);
});
