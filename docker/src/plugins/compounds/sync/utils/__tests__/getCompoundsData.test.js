import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import { getCompoundsData } from '../getCompoundsData';

dotenv.config();

test(
  'getCompoundsData',
  async () => {
    let molecule = {
      idCode:
        'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
    };
    let dataCompound = await getCompoundsData(molecule);
    expect(dataCompound).toMatchSnapshot();
  },
  { timeout: 30000 },
);
test(
  'getCompoundData test if index are correct',
  async () => {
    let molecule = {
      smiles: 'CCOCC',
    };
    let dataCompound = await getCompoundsData(molecule);
    expect(dataCompound).toMatchSnapshot();
  },
  { timeout: 30000 },
);
