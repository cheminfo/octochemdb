import dotenv from 'dotenv';
import { expect, test } from 'vitest';

import { getCompoundsData } from '../getCompoundsData';

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
