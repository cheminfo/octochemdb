import { readFileSync } from 'fs';
import { join } from 'path';

import improveCompoundPool from '../improveCompoundPool.js';

test('creation of molecular formula', async () => {
  let molfile = readFileSync(join(__dirname, 'data/test.mol'), 'utf8');
  let molecule = {
    PUBCHEM_COMPOUND_CID: 1234,
    molfile,
  };
  let result = await improveCompoundPool(molecule);
  expect(result).toMatchSnapshot();
});
