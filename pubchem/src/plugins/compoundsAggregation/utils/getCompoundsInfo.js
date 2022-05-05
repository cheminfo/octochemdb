import Debug from '../../../utils/Debug.js';

async function getCompoundsInfo(
  data,
  compoundsCollection,
  noStereoID,
  connection,
) {
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
    let searchParameter = {
      'data.ocl.noStereoID': noStereoID,
    };

    let cursor = await compoundsCollection.find(searchParameter).limit(1);

    let compoundIfo = await cursor.next();
    let entry = {};
    if (compoundIfo !== null) {
      entry = {
        data: {
          em: compoundIfo.data.em,
          charge: compoundIfo.data.charge,
          unsaturation: compoundIfo.data.unsaturation,
          active,
        },
      };
    } else {
      //just for test since i do not use the full compounds collection
      entry = {
        data: {
          em: '1',
          charge: '1',
          unsaturation: '1',
          active,
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

    return entry;
  } catch (e) {
    const optionsDebug = { collection: 'bestOfCompounds', connection };
    debug(e, optionsDebug);
  }
}

export default getCompoundsInfo;
