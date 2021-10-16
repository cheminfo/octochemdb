import { readFileSync } from 'fs';
import { join } from 'path';

import improveCompound from '../improveCompound.js';

test('creation of molecular formula', () => {
  let molfile = readFileSync(join(__dirname, 'test.mol'), 'utf8');
  let molecule = {
    PUBCHEM_COMPOUND_CID: 1234,
    molfile,
  };
  let result = improveCompound(molecule);
  expect(result).toMatchSnapshot();
});
