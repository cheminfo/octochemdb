export function recursiveRemoveNa(obj) {
  for (const key in obj) {
    if (obj[key] === 'NA' || obj[key] === 'n. a.') {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      recursiveRemoveNa(obj[key]);
    }
  }
}
