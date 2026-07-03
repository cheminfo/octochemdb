/**
 * Augments a MongoDB match parameter with spectrum-peak constraints, requiring the given
 * `field` array to contain a peak within the ppm tolerance of each requested mass. The
 * per-mass conditions are combined with `$and`.
 * @param matchParameter - The existing match object to extend.
 * @param field - Dotted path of the peak array field to match against (e.g. `data.spectrum.data.x`).
 * @param masses - Space/comma/semicolon/colon separated list of masses to match, or empty string.
 * @param precision - Allowed error in ppm used to compute the per-mass tolerance.
 * @returns The updated match parameter object.
 */
export function prepareSpectraQuery(matchParameter, field, masses, precision) {
  let massesArray = masses.split(/[, \t\n\r:;]+/);
  let spectraParameters = [];
  if (massesArray.length > 0 && massesArray[0] !== '') {
    for (let massString of massesArray) {
      const mass = Number(massString);
      const error = (mass / 1e6) * precision;
      spectraParameters.push({
        [field]: {
          $elemMatch: {
            $gte: mass - error,
            $lte: mass + error,
          },
        },
      });
    }
    matchParameter.$and = spectraParameters;
  }
  return matchParameter;
}
