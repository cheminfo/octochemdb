/**
 * Extracts the unique m/z values from an array of fragment mass objects and returns them as a numerically sorted list.
 * @param masses - Array of fragment objects, each optionally having an mz property.
 * @returns Sorted array of unique numeric m/z values.
 */
export function getMasses(masses) {
  let result = {};
  for (let i = 0; i < masses.length; i++) {
    if (masses[i]?.mz) {
      result[masses[i].mz] = true;
    }
  }
  return Object.keys(result)
    .map(Number)
    .sort((a, b) => a - b);
}
