import workerpool from 'workerpool';

//import debugLibrary from '../../../../utils/Debug.js';

import { getSubstanceData } from './getSubstanceData.js';

//const debug = debugLibrary('getSubstanceData');

/**
 * @description parse the substance molecule and return the data to be imported
 * @param {*} molecule data of the molecule in substance file
 * @returns {Promise} data to be imported
 */
async function improveSubstance(molecule) {
  let dataCompound = await getSubstanceData(molecule);
  if (dataCompound?.data) {
    let result = {
      _id: +molecule.PUBCHEM_SUBSTANCE_ID,
      _seq: 0,
      naturalProduct: false,
      data: dataCompound.data,
    };

    if (molecule.PUBCHEM_CID_ASSOCIATIONS !== undefined) {
      let arrayCIDs = molecule.PUBCHEM_CID_ASSOCIATIONS.toString()
        .replace(/(?:\r\n|\n|\r)/gm, '  ')
        .split('  ');
      let cids = [];
      for (let i = 0; i < arrayCIDs.length; i++) {
        if ((i + 1) % 2 !== 0) {
          cids.push(Number(arrayCIDs[i]));
        }
      }
      result.data.cids = cids;
    }

    if (molecule.PUBCHEM_NCBI_TAXONOMY_ID !== undefined) {
      result.data.taxonomyIDs = molecule.PUBCHEM_NCBI_TAXONOMY_ID.toString()
        .replace(/(?:\r\n|\n|\r)/gm, '  ')
        .split('  ');
      result.naturalProduct = true;
    }
    if (molecule.PUBCHEM_PUBMED_ID !== undefined) {
      let pmidsString = molecule.PUBCHEM_PUBMED_ID.toString()
        .replace(/(?:\r\n|\n|\r)/gm, '  ')
        .split('  ');
      let pmids = [];
      for (let pmid of pmidsString) {
        pmids.push(Number(pmid));
      }
      result.data.pmids = pmids;
    }
    if (molecule.PUBCHEM_SUBSTANCE_COMMENT !== undefined) {
      result.data.comment =
        molecule.PUBCHEM_SUBSTANCE_COMMENT.toString().replace(
          /(?:\r\n|\n|\r)/gm,
          ' ',
        );
    }

    if (molecule.PUBCHEM_PATENT_ID !== undefined) {
      result.data.patents = molecule.PUBCHEM_PATENT_ID.toString()
        .replace(/(?:\r\n|\n|\r)/gm, '  ')
        .split('  ');
    }
    if (molecule.PUBCHEM_PUBMED_MESH_TERM !== undefined) {
      result.data.meshTerms = molecule.PUBCHEM_PUBMED_MESH_TERM;
    }

    return result;
  }
}

workerpool.worker({
  improveSubstance,
});
