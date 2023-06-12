import { getCompoundsData } from '../../compounds/sync/utils/getCompoundsData.js';

import getCIDs from './getCIDs.js';

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
  let { cids, cidsDBRef, dbRefsMolecules } = await getCIDs(
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
  const parsedCompoundInfo = {
    entry,
    compoundsIds: cids,
    casNumbers,
    meshTerms,
    pmids,
    cidsDBRef,
    dbRefsMolecules,
  };
  return parsedCompoundInfo;
}
