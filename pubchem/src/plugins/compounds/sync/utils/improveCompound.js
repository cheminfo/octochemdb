import MFParser from 'mf-parser';
import workerpool from 'workerpool';

import Debug from '../../../../utils/Debug.js';

import { getCompoundsData } from './getCompoundsData.js';

const { MF } = MFParser;
const debug = Debug('improveCompound');

/**
 * @description Parse molecule from pubchem file
 * @param {*} molecule molecule from pubchem file
 * @returns {Promise<object>} result to be imported
 */
async function improveCompound(molecule) {
  let dataCompound = getCompoundsData(molecule);
  let result = {
    data: dataCompound.data,
  };
  if (molecule.molfile) {
    result._id = +molecule.PUBCHEM_COMPOUND_CID;
    result._seq = 0;
    result.data.inchi = molecule.PUBCHEM_IUPAC_INCHI;
    result.data.inchiKey = molecule.PUBCHEM_IUPAC_INCHIKEY;
    result.data.iupac = molecule.PUBCHEM_IUPAC_NAME;
    result.data.molfile = molecule.molfile;
  }

  try {
    const mfInfo = new MF(result.data.globalMF).getInfo();
    result.data.em = mfInfo.monoisotopicMass;
    result.data.mw = mfInfo.mass;
    result.data.unsaturation = mfInfo.unsaturation;
    result.data.charge = mfInfo.charge;
    result.data.atom = mfInfo.atoms;
  } catch (e) {
    debug(e);
  }
  return result;
}

workerpool.worker({
  improveCompound,
});
