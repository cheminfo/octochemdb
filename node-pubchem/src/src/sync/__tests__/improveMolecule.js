'use strict';

const { readFileSync } = require('fs');
const { join } = require('path');

const improveMolecule = require('../improveMolecule');

test('creation of molecular formula', () => {
  let molfile = readFileSync(join(__dirname, 'test.mol'), 'utf8');
  let molecule = {
    PUBCHEM_COMPOUND_CID: 1234,
    molfile,
  };
  let result = improveMolecule(molecule);
  expect(result).toMatchSnapshot();
});
