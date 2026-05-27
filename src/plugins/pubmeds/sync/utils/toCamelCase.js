import camelCase from 'camelcase';

/**
 * Shallow-converts the top-level keys of `entry` to camelCase.
 *
 * For values that are plain objects (one level deep), their keys are
 * also converted to camelCase **in place** (mutating the original
 * nested object).
 * @param entry - Object whose keys should
 *   be camelCase-normalised.
 * @returns New object with camelCased keys.
 */
export function toCamelCase(entry) {
  const result = {};
  for (const key in entry) {
    // Convert keys of one-level-deep nested objects in place
    if (typeof entry[key] === 'object' && entry[key] !== null) {
      const subEntry = entry[key];
      for (const subKey in subEntry) {
        subEntry[camelCase(subKey)] = subEntry[subKey];
        delete subEntry[subKey];
      }
    }
    result[camelCase(key)] = entry[key];
  }
  return result;
}
