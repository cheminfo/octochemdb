export function recursiveLowerCase(obj) {
  if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      const lowerKey = key.toLowerCase();
      if (key !== lowerKey) {
        obj[lowerKey] = obj[key];
        delete obj[key];
      }
      recursiveLowerCase(obj[lowerKey]);
    }
  }
}
