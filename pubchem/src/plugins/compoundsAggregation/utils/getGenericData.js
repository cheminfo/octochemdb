async function getGenericData(data, mfInfo) {
  let cid = {};
  let cas = {};
  let iupacName = {};
  let ocls = {};
  for (const info of data) {
    ocls[info.data.ocl.id] = {
      id: info.data.ocl.id,
      coordinates: info.data.ocl.coordinates,
    };
    if (info.data?.cid) cid[info.data?.cid] = true;
    if (info.data?.cas) cas[info.data?.cas] = true;
    if (info.data?.iupacName) iupacName[info.data?.iupacName] = true;
  }
  let npActive = false;

  const entry = {
    data: {
      em: mfInfo.monoisotopicMass,
      charge: mfInfo.charge,
      unsaturation: mfInfo.unsaturation,
      npActive: npActive,
    },
  };

  ocls = Object.values(ocls);
  cid = Object.keys(cid);
  cas = Object.keys(cas);
  iupacName = Object.keys(iupacName);
  if (ocls.length > 0) entry.data.ocls = ocls;
  if (cid.length > 0) entry.data.cids = cid;
  if (cas.length > 0) entry.data.cas = cas;
  if (iupacName.length > 0) entry.data.iupacName = iupacName;

  return entry;
}

export default getGenericData;
