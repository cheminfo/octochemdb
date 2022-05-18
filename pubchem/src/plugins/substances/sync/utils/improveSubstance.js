import { getSubstanceData } from './getSubstanceData.js';
export default async function improveSubstance(molecule) {
  let result = {
    _id: +molecule.PUBCHEM_SUBSTANCE_ID,
    _seq: 0,
    naturalProduct: false,
    data: {
      molfile: molecule.molfile,
    },
  };

  let ocl = await getSubstanceData(molecule);
  result.data.ocl = ocl;
  if (molecule.PUBCHEM_CID_ASSOCIATIONS !== undefined) {
    let arrayCIDs = molecule.PUBCHEM_CID_ASSOCIATIONS.replace(
      /(\r\n|\n|\r)/gm,
      '  ',
    ).split('  ');
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
    result.data.taxonomyIDs = molecule.PUBCHEM_NCBI_TAXONOMY_ID.replace(
      /(\r\n|\n|\r)/gm,
      '  ',
    ).split('  ');
    result.naturalProduct = true;
  }
  if (molecule.PUBCHEM_PUBMED_ID !== undefined) {
    let pmidsString = molecule.PUBCHEM_PUBMED_ID.replace(
      /(\r\n|\n|\r)/gm,
      '  ',
    ).split('  ');
    let pmids = [];
    for (let pmid of pmidsString) {
      pmids.push(Number(pmid));
    }
    result.data.pmids = pmids;
  }
  if (molecule.PUBCHEM_SUBSTANCE_COMMENT !== undefined) {
    result.data.comment = molecule.PUBCHEM_SUBSTANCE_COMMENT.replace(
      /(\r\n|\n|\r)/gm,
      ' ',
    );
  }

  if (molecule.PUBCHEM_PATENT_ID !== undefined) {
    result.data.patents = molecule.PUBCHEM_PATENT_ID.replace(
      /(\r\n|\n|\r)/gm,
      '  ',
    ).split('  ');
  }
  if (molecule.PUBCHEM_PUBMED_MESH_TERM !== undefined) {
    result.data.meshTerms = molecule.PUBCHEM_PUBMED_MESH_TERM;
  }
  return result;
}
