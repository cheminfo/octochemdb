import Debug from '../../../utils/Debug.js';

async function getCompoundsInfo(data, mfInfo, connection) {
  const debug = Debug('getCompoundsInfo');

  try {
    let cid = {};
    let cas = {};
    let names = {};
    let ocls = {};
    for (const info of data) {
      ocls[info.data.ocl.id] = {
        id: info.data.ocl?.id,
        coordinates: info.data.ocl?.coordinates,
      };
      if (info.data?.cid) cid[Number(info.data?.cid)] = true;
      if (info.data?.cas) cas[Number(info.data?.cas)] = true;
      if (info.data?.iupacName) names[info.data?.iupacName] = true;
    }
    let active = false;

    const entry = {
      data: {
        em: mfInfo.monoisotopicMass,
        charge: mfInfo.charge,
        unsaturation: mfInfo.unsaturation,
        active,
      },
    };

    ocls = Object.values(ocls);
    cid = Object.keys(cid);
    cas = Object.keys(cas);
    names = Object.keys(names);
    if (ocls.length > 0) entry.data.ocls = ocls;
    if (cid.length > 0) entry.data.cids = cid;
    if (cas.length > 0) entry.data.cas = cas;
    if (names.length > 0) entry.data.names = names;

    return entry;
  } catch (e) {
    const optionsDebug = { collection: 'bestOfCompounds', connection };
    debug(e, optionsDebug);
  }
}

export default getCompoundsInfo;
