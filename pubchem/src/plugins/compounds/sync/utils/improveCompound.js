import MFParser from 'mf-parser';
import OCL from 'openchemlib';
import { getMF } from 'openchemlib-utils';
import workerpool from 'workerpool';

import Debug from '../../../../utils/Debug.js';

const { MF } = MFParser;
const debug = Debug('improveCompound');

async function improveCompound(molecule) {
  const oclMolecule = OCL.Molecule.fromMolfile(molecule.molfile);

  const oclProperties = new OCL.MoleculeProperties(oclMolecule);

  const oclID = oclMolecule.getIDCodeAndCoordinates();
  const oclIndex = Array.from(oclMolecule.getIndex());
  const moleculeMF = getMF(oclMolecule);
  const mfParts = moleculeMF.parts;
  const nbFragments = mfParts.length;
  const mf = mfParts.join(' . ');
  const globalMF = moleculeMF.mf;
  oclMolecule.stripStereoInformation();
  const noStereoID = oclMolecule.getIDCode();
  let result = {
    _id: +molecule.PUBCHEM_COMPOUND_CID,
    _seq: 0,
    data: {
      ocl: {
        id: oclID.idCode,
        coordinates: oclID.coordinates,
        index: oclIndex,
        noStereoID,

        acceptorCount: oclProperties.acceptorCount,
        donorCount: oclProperties.donorCount,
        logP: oclProperties.logP,
        logS: oclProperties.logS,
        polarSurfaceArea: oclProperties.polarSurfaceArea,
        rotatableBondCount: oclProperties.rotatableBondCount,
        stereoCenterCount: oclProperties.stereoCenterCount,
      },
      inchi: molecule.PUBCHEM_IUPAC_INCHI,
      inchiKey: molecule.PUBCHEM_IUPAC_INCHIKEY,
      iupac: molecule.PUBCHEM_IUPAC_NAME,
      molfile: molecule.molfile,
      mf: mf,
      nbFragments,
    },
  };

  try {
    const mfInfo = new MF(globalMF).getInfo();
    result.data.em = mfInfo.monoisotopicMass;
    result.data.mw = mfInfo.mass;
    result.data.unsaturation = mfInfo.unsaturation;
    result.data.charge = mfInfo.charge;
    result.data.atom = mfInfo.atoms;
  } catch (e) {
    debug(`${e}, ${mf}`);
  }
  return result;
}

workerpool.worker({
  improveCompound,
});
