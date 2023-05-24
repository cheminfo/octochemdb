import camelCase from 'camelcase';

export function toCamelCase(entry) {
  let result = {};
  for (let key in entry) {
    if (typeof entry[key] === 'object' && entry[key] !== null) {
      let subEntry = entry[key];
      for (let subKey in subEntry) {
        subEntry[camelCase(subKey)] = subEntry[subKey];
        delete subEntry[subKey];
      }
    }
    result[camelCase(key)] = entry[key];
  }
  return result;
}
