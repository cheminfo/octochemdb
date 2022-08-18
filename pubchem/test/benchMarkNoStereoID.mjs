import Benchmark from 'benchmark';
import OCL from 'openchemlib';

import getNoStereoIDCode from '../src/sync/utils/getNoStreoIDCode.js';

// benchmark to get no stereo ID code with getNoStereoIDCode or with OCL stripStereoInformation method
// 1. getNoStereoIDCode
// 2. OCL stripStereoInformation
// 3. OCL stripStereoInformation and getIDCodeAndCoordinates

const suite = new Benchmark.Suite();
suite
  .add('old', () => {
    const oclMolecule2 = OCL.Molecule.fromSmiles('CCC(=O)CC');
    oclMolecule2.stripStereoInformation();
    const noStereoID2 = oclMolecule2.getIDCode();
  })
  .add('new', () => {
    const oclMolecule = OCL.Molecule.fromSmiles('CC=C(O)CC');
    const noStereoID = getNoStereoIDCode(oclMolecule);
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function onComplete() {
    console.log(`Fastest is ${this.filter('fastest').map('name')}`);
  })
  .run();
