import MFParser from 'mf-parser';
import workerpool from 'workerpool';

import Debug from '../../../../utils/Debug.js';
import { getCompoundsData } from './getCompoundsData.js';
const { MF } = MFParser;
const debug = Debug('improveCompound');

async function improveCompound(molecule, connection) {
  let dataCompound = await getCompoundsData(molecule, connection);
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
    const optionsDebug = { collection: 'compounds', connection };
    debug(e, optionsDebug);
  }
  return result;
}

workerpool.worker({
  improveCompound,
});
