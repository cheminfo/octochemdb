import debug from 'debug';

import { getCompoundsData } from './getCompoundsData.js';
/**
 * @description Parse molecule from pubchem file
 * @param {*} molecule molecule from pubchem file
 * @returns {Promise<object>} result to be imported
 */
export default async function improveCompound(molecule) {
  try {
    //console.log(molecule);

    let dataCompound = await getCompoundsData(molecule);

    if (dataCompound?.data) {
      let result = {
        data: dataCompound.data,
      };
      if (molecule.molfile) {
        result._id = molecule.PUBCHEM_COMPOUND_CID;
        result._seq = 0;
        result.data.inchi = molecule.PUBCHEM_IUPAC_INCHI;
        result.data.inchiKey = molecule.PUBCHEM_IUPAC_INCHIKEY;
        result.data.iupac = molecule.PUBCHEM_IUPAC_NAME;
        result.data.molfile = molecule.molfile;
      }
      return result;
    }
  } catch (e) {
    debug(e);
  }
}
