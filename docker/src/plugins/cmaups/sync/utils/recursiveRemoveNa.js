/**
 * Recursively removes every property whose value equals one of the CMAUP
 * missing-value sentinels (`'NA'`, `'n. a.'`, or `'n.a.'`) from a nested
 * object tree, mutating it in-place.
 *
 * Each enumerable key is checked at the current level before descending into any
 * non-null child objects. `null` values are skipped explicitly (avoids the
 * `typeof null === 'object'` pitfall). Circular references are detected via a
 * shared `Set` of visited object references and silently skipped, preventing
 * infinite recursion.
 *
 * @param {object} obj - Nested plain-object tree to clean.
 * @returns {void}
 */
export function recursiveRemoveNa(obj) {
  const seen = new Set();
  const record = /** @type {NaCleanupRecord} */ (obj);
  removeNaImpl(record, seen);
}

/**
 * Inner recursive worker called by {@link recursiveRemoveNa}.
 *
 * @param {NaCleanupRecord} obj - Current node being walked.
 * @param {Set<object>} seen - Accumulates visited object references to detect cycles.
 * @returns {void}
 */
function removeNaImpl(obj, seen) {
  if (seen.has(obj)) return;
  seen.add(obj);
  for (const key in obj) {
    if (obj[key] === 'NA' || obj[key] === 'n. a.' || obj[key] === 'n.a.') {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // obj[key] is confirmed non-null here; its own child properties are
      // not guaranteed to be non-null and will be checked in the next frame.
      const child = /** @type {NaCleanupRecord} */ (obj[key]);
      removeNaImpl(child, seen);
    }
  }
}
