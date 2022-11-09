import OCL from 'openchemlib';
import workerpool from 'workerpool';

async function improve(entry) {
  // get the oclID
  const oclID = entry.data.ocl.noStereoTautomerID;
  // get the molecule
  const molecule = OCL.Molecule.fromIDCode(oclID);

  let fragmentMap = [];
  let nbFragments = molecule.getFragmentNumbers(fragmentMap, false, false);
  entry.data.nbFragments = nbFragments;
  return entry;
}

workerpool.worker({
  improve,
});
