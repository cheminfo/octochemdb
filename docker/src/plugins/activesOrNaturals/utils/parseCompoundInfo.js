import OCL from 'openchemlib';

import { getCompoundsData } from '../../compounds/sync/utils/getCompoundsData.js';

export default async function parseCompoundInfo(compoundInfo, entry, data) {
  let cids = {};
  let cas = {};
  let pmids = [];
  let meshTerms = [];
  let ocl = {};
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

    if (oneDataEntry.data.cid) {
      cids[oneDataEntry.data.cid] = true;
    }
    if (oneDataEntry.data.cas) {
      cas[oneDataEntry.data.cas] = true;
    }
    if (!ocl.coordinates) {
      let idCode = oneDataEntry.data.ocl.idCode;
      let molecule = OCL.Molecule.fromIDCode(idCode);
      molecule.stripStereoInformation();
      ocl.noStereoID = molecule.getIDCodeAndCoordinates().idCode;
      ocl.coordinates = molecule.getIDCodeAndCoordinates().coordinates;
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

    let compoundData = await getCompoundsData({ idCode: idToSearch });
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
    cids[compoundInfo._id] = true;
  }
  entry.data.ocl = ocl;
  let casNumbers = Object.keys(cas);
  let compoundsIds = Object.keys(cids);
  const parsedCompoundInfo = {
    entry,
    compoundsIds,
    casNumbers,
    meshTerms,
    pmids,
  };
  return parsedCompoundInfo;
}
