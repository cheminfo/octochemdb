/**
 * Adds `$gte` / `$lte` range filters to `matchParameter` for every
 * min/max pair whose values are defined.
 * @param {Record<string, unknown>} matchParameter - MongoDB match object (mutated in place)
 * @param {Array<Record<string, MinMaxRange>>} minMaxQuery - array of `{ field: { min?, max? } }` descriptors
 */
export function prepareMinMaxQuery(matchParameter, minMaxQuery) {
  for (const query of minMaxQuery) {
    for (const [key, value] of Object.entries(query)) {
      if (value.min !== undefined || value.max !== undefined) {
        /** @type {Record<string, number>} */
        const condition = {};
        if (value.min !== undefined) condition.$gte = value.min;
        if (value.max !== undefined) condition.$lte = value.max;
        matchParameter[key] = condition;
      }
    }
  }
}
