import Debug from '../../../../utils/Debug.js';
import { getSubstanceData } from './getSubstanceData.js';
const debug = Debug('getSubstanceData');
export default function improveSubstance(molecule, connection) {
  let result = {
    _id: +molecule.PUBCHEM_SUBSTANCE_ID,
    _seq: 0,
    naturalProduct: false,
    data: {
      molfile: molecule.molfile,
    },
  };
  try {
    let ocl =  getSubstanceData(molecule, connection);
    result.data.ocl = ocl;

    if (molecule.PUBCHEM_CID_ASSOCIATIONS !== undefined) {
      let arrayCIDs = molecule.PUBCHEM_CID_ASSOCIATIONS.toString()
        .replace(/(\r\n|\n|\r)/gm, '  ')
        .split('  ');
      let cids = [];
      for (let i = 0; i < arrayCIDs.length; i++) {
        if ((i + 1) % 2 !== 0) {
          cids.push(Number(arrayCIDs[i]));
        }
      }
      result.data.cids = cids;
    }
    if (molecule.PUBCHEM_TOTAL_CHARGE !== undefined) {
      result.data.charge = molecule.PUBCHEM_TOTAL_CHARGE;
    }
    if (molecule.PUBCHEM_NCBI_TAXONOMY_ID !== undefined) {
      result.data.taxonomyIDs = molecule.PUBCHEM_NCBI_TAXONOMY_ID.toString()
        .replace(/(\r\n|\n|\r)/gm, '  ')
        .split('  ');
      result.naturalProduct = true;
    }
    if (molecule.PUBCHEM_PUBMED_ID !== undefined) {
      let pmidsString = molecule.PUBCHEM_PUBMED_ID.toString()
        .replace(/(\r\n|\n|\r)/gm, '  ')
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
          /(\r\n|\n|\r)/gm,
          ' ',
        );
    }

    if (molecule.PUBCHEM_PATENT_ID !== undefined) {
      result.data.patents = molecule.PUBCHEM_PATENT_ID.toString()
        .replace(/(\r\n|\n|\r)/gm, '  ')
        .split('  ');
    }
    if (molecule.PUBCHEM_PUBMED_MESH_TERM !== undefined) {
      result.data.meshTerms = molecule.PUBCHEM_PUBMED_MESH_TERM;
    }
  } catch (e) {
    const optionsDebug = { collection: 'substances', connection };
    debug(e, optionsDebug);
  }
  return result;
}
