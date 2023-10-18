export function prepareMinMaxQuery(matchParameter, minMaxQuery) {
  for (const query of minMaxQuery) {
    for (const [key, value] of Object.entries(query)) {
      if (value.min !== undefined) {
        matchParameter[key] = { $gte: value.min };
      }
      if (value.max !== undefined) {
        matchParameter[key] = { $lte: value.max };
      }
    }
  }
}
