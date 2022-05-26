import Debug from '../../../utils/Debug.js';
import { getCompoundsData } from '../../compounds/sync/utils/getCompoundsData.js';

const debug = Debug('getCompoundsInfo');

export default async function getCompoundsInfo(
  entry,
  data,
  compoundsCollection,
  noStereoID,
  connection,
) {
  try {
    let patents = [];
    let cid = {};
    let cas = {};
    let pmids = [];
    let meshTerms = [];
    for (const info of data) {
      if (info.data.patents) {
        patents.push(
          info.data.patents.filter((k) => patents.indexOf(k) === -1),
        );
      }
      if (info.data.pmids) {
        pmids.push(info.data.pmids.filter((k) => pmids.indexOf(k) === -1));
      }
      if (info.data.meshTerms) {
        meshTerms.push(
          info.data.meshTerms.filter((k) => meshTerms.indexOf(k) === -1),
        );
      }

      if (info.data.cid) {
        cid[info.data.cid] = true;
      }
      if (info.data.cas) {
        cas[info.data.cas] = true;
      }
    }
    let bioActive = false;
    let cursor = await compoundsCollection
      .find({ 'data.ocl.noStereoID': noStereoID })
      .limit(1);

    let compoundIfo = await cursor.next();

    if (compoundIfo !== null) {
      entry.data.em = compoundIfo.data.em;
      entry.data.charge = compoundIfo.data.charge;
      entry.data.unsaturation = compoundIfo.data.unsaturation;
      entry.data.mf = compoundIfo.data.mf;
      entry.data.bioActive = bioActive;
    }
    if (compoundIfo === null) {
      const molecule = { noStereoID: noStereoID };
      let compoundData = await getCompoundsData(molecule);
      entry.data.em = compoundData.data.em;
      entry.data.charge = compoundData.data.charge;
      entry.data.unsaturation = compoundData.data.unsaturation;
      entry.data.mf = compoundData.data.mf;
      entry.data.bioActive = bioActive;
    }
    cid = Object.keys(cid);
    cid.map(Number);
    cas = Object.keys(cas);
    if (cid.length > 0) entry.data.cids = cid;
    if (cas.length > 0) entry.data.cas = cas;
    if (patents.length > 0) entry.data.patents = patents;
    if (pmids.length > 0) entry.data.pmids = pmids;
    if (meshTerms.length > 0) entry.data.meshTerms = meshTerms;
    return entry;
  } catch (e) {
    const optionsDebug = { collection: 'activesOrNaturals', connection };
    debug(e, optionsDebug);
  }
}
