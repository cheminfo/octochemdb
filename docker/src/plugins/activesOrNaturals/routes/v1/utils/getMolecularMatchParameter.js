import { MF } from 'mf-parser';

export function getMolecularMatchParameter(matchParameter, molecularInfo) {
  const { mf = '', em = '', precision } = molecularInfo;
  if (mf !== '') {
    let mfinfo = new MF(mf).getInfo();
    matchParameter['data.mf'] = mfinfo.mf;
  }
  let error;
  let ems = em
    .split(/[ ,;\t\r\n]+/)
    .filter((entry) => entry)
    .map(Number);
  if (ems.length > 1) {
    let match = [];

    for (let em of ems) {
      error = (em / 1e6) * precision;
      match.push({
        'data.em': { $lt: em + error, $gt: em - error },
      });
    }
    matchParameter.$or = match;
  } else if (ems.length === 1 && ems[0] !== '') {
    error = (ems[0] / 1e6) * precision;

    matchParameter['data.em'] = { $lt: ems[0] + error, $gt: ems[0] - error };
  }
}
