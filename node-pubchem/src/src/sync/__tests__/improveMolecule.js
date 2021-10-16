import { readFileSync } from 'fs';
import { join } from 'path';

import improveMolecule from '../improveMolecule.js';

test('creation of molecular formula', () => {
  let molfile = readFileSync(join(__dirname, 'test.mol'), 'utf8');
  let molecule = {
    PUBCHEM_COMPOUND_CID: 1234,
    molfile,
  };
  let result = improveMolecule(molecule);
  expect(result).toMatchSnapshot();
});
