import { MF } from 'mass-tools';

/**
 * Augments a MongoDB match parameter with molecular-formula and/or exact-mass constraints.
 * A non-empty `mf` adds an exact `data.mf` match; one or more exact masses in `em` add
 * `data.em` range constraints (combined with `$or` when several masses are given), where
 * the tolerance is derived from `precision` in ppm.
 * @param matchParameter - The existing match object to extend.
 * @param em - Space/comma/semicolon separated list of exact masses to match, or empty string.
 * @param mf - Molecular formula to match, or empty string.
 * @param precision - Allowed error in ppm used to compute the mass tolerance.
 * @returns The updated match parameter object.
 */
export function prepareMolecularInfoQuery(matchParameter, em, mf, precision) {
  if (mf !== '') {
    let mfinfo = new MF(mf).getInfo();
    matchParameter['data.mf'] = mfinfo.mf;
  }
  let error;
  let ems = em
    .split(/[ ,;\t\r\n]+/)
    .filter(Boolean)
    .map(Number);
  if (ems.length > 1) {
    let match = [];

    for (let em of ems) {
      error = (em / 1e6) * precision;
      match.push({
        'data.em': { $lt: em + error, $gt: em - error },
      });
    }
    matchParameter = { $or: match };
  } else if (ems.length === 1 && ems[0] !== '') {
    error = (ems[0] / 1e6) * precision;

    matchParameter = {
      'data.em': { $lt: ems[0] + error, $gt: ems[0] - error },
    };
  }
  return matchParameter;
}
