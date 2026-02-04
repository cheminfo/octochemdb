import OCL from 'openchemlib';

import { getCompoundsData } from '../../compounds/sync/utils/getCompoundsData.js';

import getCIDs from './getCIDs.js';
/**
 * @description parses compound information for activesOrNaturals plugin
 * @param {Object} compoundInfo - compound information from compounds collection
 * @param {String} noStereoTautomerID - noStereoTautomerID of the compound
 * @param {*} connection - mongo connection
 * @param {Object} entry - entry to be updated
 * @param {Array<Object>} data - array of data from all collections for the current noStereoTautomerID
 * @returns {Promise<Object>} returns parsed compound information
 */
export default async function parseCompoundInfo(
  compoundInfo,
  noStereoTautomerID,
  connection,
  entry,
  data,
) {
  let cas = {};
  let pmids = [];
  let meshTerms = [];
  let ocl = [];
  let { cids, cidsDBRef, dbRefsMolecules, titles } = await getCIDs(
    connection,
    noStereoTautomerID,
    data,
  );

  for (const oneDataEntry of data) {
    if (oneDataEntry.data.pmids) {
      oneDataEntry.data.pmids.forEach((k) => {
        if (!pmids.includes(k)) {
          pmids.push(k);
        }
      });
    }
    if (oneDataEntry.data.meshTerms) {
      oneDataEntry.data.meshTerms.forEach((k) => {
        if (!meshTerms.includes(k)) {
          meshTerms.push(k);
        }
      });
    }

    if (oneDataEntry.data.cas) {
      cas[oneDataEntry.data.cas] = true;
    }

    if (
      oneDataEntry.data.ocl.noStereoID !== undefined &&
      oneDataEntry.data.ocl.coordinates !== undefined
    ) {
      ocl.push({
        coordinates: oneDataEntry.data.ocl.coordinates,
        idCode: oneDataEntry.data.ocl.noStereoID,
      });
    } else {
      let idCode = oneDataEntry.data.ocl.idCode;
      let molecule = OCL.Molecule.fromIDCode(idCode);
      molecule.stripStereoInformation();
      ocl.push({
        idCode: molecule.getIDCodeAndCoordinates().idCode,
        coordinates: molecule.getIDCodeAndCoordinates().coordinates,
      });
    }
  }

  if (compoundInfo?.data?.em === undefined) {
    let idToSearch;
    for (const oneDataEntry of data) {
      if (oneDataEntry.data.ocl.idCode) {
        idToSearch = oneDataEntry.data.ocl.idCode;
        break;
      }
    }

    let compoundData = await getCompoundsData(
      { idCode: idToSearch },
      { indexRequired: false },
    );
    entry.data.em = compoundData?.data.em;
    entry.data.charge = compoundData?.data.charge;
    entry.data.unsaturation = compoundData?.data.unsaturation;
    entry.data.mf = compoundData?.data.mf;
    entry.data.bioactive = false;
  } else {
    entry.data.em = compoundInfo.data.em;
    entry.data.charge = compoundInfo.data.charge;
    entry.data.unsaturation = compoundInfo.data.unsaturation;
    entry.data.mf = compoundInfo.data.mf;
    entry.data.bioactive = false;
  }
  let casNumbers = Object.keys(cas);
  entry.data.noStereoOCL = ocl;
  const parsedCompoundInfo = {
    entry,
    compoundsIds: cids,
    casNumbers,
    meshTerms,
    pmids,
    cidsDBRef,
    dbRefsMolecules,
    titles,
  };
  return parsedCompoundInfo;
}
