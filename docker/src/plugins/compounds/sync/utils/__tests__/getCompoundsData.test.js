import { test, expect } from 'vitest';
import 'dotenv/config';

import { getCompoundsData } from '../getCompoundsData';

test('getCompoundsData', async () => {
  let molecule = {
    idCode:
      'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
  };
  let dataCompound = await getCompoundsData(molecule);
  expect(dataCompound).toMatchSnapshot();
}, 10000);
