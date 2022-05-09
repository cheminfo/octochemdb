import Debug from '../../../utils/Debug.js';

async function getCompoundsInfo(
  data,
  compoundsCollection,
  noStereoID,
  connection,
) {
  const debug = Debug('getCompoundsInfo');
  debug(data);
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
    let searchParameter = {
      'data.ocl.noStereoID': noStereoID,
    };

    let cursor = await compoundsCollection.find(searchParameter).limit(1);

    let compoundIfo = await cursor.next();
    let entry = {};
    entry = {
      data: {
        em: compoundIfo.data.em,
        charge: compoundIfo.data.charge,
        unsaturation: compoundIfo.data.unsaturation,
        active,
      },
    };

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

    return entry;
  } catch (e) {
    const optionsDebug = { collection: 'bestOfCompounds', connection };
    debug(e, optionsDebug);
  }
}

export default getCompoundsInfo;
