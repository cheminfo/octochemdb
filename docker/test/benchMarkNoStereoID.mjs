import { join } from 'path';

import Benchmark from 'benchmark';
import fs from 'fs-extra';
import OCL from 'openchemlib';

// 1. stripStereoInformation + getIDCode (oldMethod)
// 2. CanonizerUtil with NOSTEREO (newMethodNoStereo)
// 3. CanonizerUtil NOSTEREO_TAUTOMER (newMethodNoStereoTautomer)
// 4. Using old version OCL: method stripStereoInformation + getIDCode npm i openchemlib-js@8.0.1
// 5. npm i openchemlib-js@latest

// read text file with 4096 SMILES
const text = fs.readFileSync(join('pubchem/test/smilesList.txt'), 'utf8');
const smilesList = text.split('\n');

// methods to be call
function oldMethod(smiles) {
  const oclMolecule = OCL.Molecule.fromSmiles(smiles);
  oclMolecule.stripStereoInformation();
  return oclMolecule.getIDCode();
}

function newMethodNoStereo(smiles) {
  const oclMolecule = OCL.Molecule.fromSmiles(smiles);
  return OCL.CanonizerUtil.getIDCode(oclMolecule, OCL.CanonizerUtil.NOSTEREO);
}

function newMethodNoStereoTautomer(smiles) {
  const oclMolecule = OCL.Molecule.fromSmiles(smiles);
  return OCL.CanonizerUtil.getIDCode(
    oclMolecule,
    OCL.CanonizerUtil.NOSTEREO_TAUTOMER,
  );
}

const suite = new Benchmark.Suite();
suite
  .add('oldMethod', () => {
    for (let i = 0; i < smilesList.length; i++) {
      oldMethod(smilesList[i]);
    }
  })
  .add('newMethodNoStereo', () => {
    for (let i = 0; i < smilesList.length; i++) {
      newMethodNoStereo(smilesList[i]);
    }
  })
  .add('newMethodNoStereoTautomer', () => {
    for (let i = 0; i < smilesList.length; i++) {
      newMethodNoStereoTautomer(smilesList[i]);
    }
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function onComplete() {
    console.log(`Fastest is ${this.filter('fastest').map('name')}`);
    // get time in ms
    console.log(this[0].times.period);
    console.log(this[1].times.period);
    console.log(this[2].times.period);
  })
  .run();
