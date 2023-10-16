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
}
