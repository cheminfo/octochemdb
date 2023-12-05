export function getMasses(masses) {
  let result = {};
  for (let i = 0; i < masses.length; i++) {
    if (masses[i]?.mz) {
      result[masses[i].mz] = true;
    }
  }
  return Object.keys(result).map(Number);
}
