'use strict';

const fs = require('fs-extra');

const improveMolecule = require('../improveMolecule');

test('creation of molecular formula', () => {
  let molfile = fs.readFileSync(`${__dirname}/test.mol`, 'utf8');
  let molecule = {
    PUBCHEM_COMPOUND_CID: 1234,
    molfile
  };
  let result = improveMolecule(molecule);
  expect(result).toMatchSnapshot();
});

