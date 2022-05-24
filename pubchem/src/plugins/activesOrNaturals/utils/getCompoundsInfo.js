import Debug from '../../../utils/Debug.js';
import { getCompoundsData } from '../../compounds/sync/utils/getCompoundsData.js';
const debug = Debug('getCompoundsInfo');

export default async function getCompoundsInfo(
  data,
  compoundsCollection,
  noStereoID,
  connection,
) {
  try {
    let cid = {};
    let cas = {};
    let names = {};
    let ocls = {};
    let patents = [];
    let pmids = [];
    let meshTerms = [];
    for (const info of data) {
      if (info.data?.patents) {
        patents.push(info.data.patents);
      }
      if (info.data?.pmids) {
        pmids.push(info.data.pmids);
      }
      if (info.data?.meshTerms) {
        meshTerms.push(info.data.meshTerms);
      }
      ocls[info.data.ocl.id] = {
        id: info.data.ocl?.id,
        coordinates: info.data.ocl?.coordinates,
      };
      if (info.data?.cid) {
        if (!isNaN(Number(info.data?.cid))) {
          cid[Number(info.data?.cid)] = true;
        }
      }
      if (info.data?.cas) {
        if (!isNaN(Number(info.data?.cas))) {
          cas[Number(info.data?.cas)] = true;
        }
      }
      if (info.data?.iupacName) {
        names[info.data?.iupacName] = true;
      }
    }
    let active = false;
    let naturalProduct = false;

    let cursor = await compoundsCollection
      .find({ 'data.ocl.noStereoID': noStereoID })
      .limit(1);

    let compoundIfo = await cursor.next();
    let entry = {};

    if (compoundIfo !== null) {
      entry = {
        data: {
          em: compoundIfo.data.em,
          charge: compoundIfo.data.charge,
          unsaturation: compoundIfo.data.unsaturation,
          mf: compoundIfo.data.mf,
          active,
          naturalProduct,
        },
      };
    }
    if (compoundIfo === null) {
      const molecule = { noStereoID: noStereoID };
      let compoundData = await getCompoundsData(molecule);
      entry = {
        data: {
          em: compoundData.data.em,
          charge: compoundData.data.charge,
          unsaturation: compoundData.data.unsaturation,
          mf: compoundData.data.mf,
          active,
          naturalProduct,
        },
      };
    }
    ocls = Object.values(ocls);
    cid = Object.keys(cid);
    let cidsNumber = [];
    cid.forEach((str) => {
      cidsNumber.push(Number(str));
    });
    let casNumbers = [];
    cas = Object.keys(cas);
    cas.forEach((str) => {
      casNumbers.push(Number(str));
    });
    names = Object.keys(names);
    if (ocls.length > 0) entry.data.ocls = ocls;
    if (cidsNumber.length > 0) entry.data.cids = cidsNumber;
    if (casNumbers.length > 0) entry.data.cas = casNumbers;
    if (names.length > 0) entry.data.names = names;
    if (patents.length > 0) entry.data.patents = patents;
    if (pmids.length > 0) entry.data.pmids = pmids;
    if (meshTerms.length > 0) entry.data.meshTerms = meshTerms;
    return entry;
  } catch (e) {
    const optionsDebug = { collection: 'activesOrNaturals', connection };
    debug(e, optionsDebug);
  }
}
