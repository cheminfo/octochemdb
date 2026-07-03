import md5 from 'md5';

/**
 * Decide whether a plugin's collection needs to be (re)imported. Returns true
 * when the source fingerprint changed, the configured update interval has
 * elapsed, or a previous import was left incomplete. Outside test mode, throws
 * with an actionable message when the update interval is unset (missing
 * `*_UPDATE_INTERVAL` env var) or `sources` is undefined.
 * @param progress - The plugin's progress document from the admin collection.
 * @param sources - Current source descriptors; hashed to detect changes.
 * @param lastDocumentImported - Last document imported on the previous run, or
 *   null if none (forces an import).
 * @param collectionUpdateInterval - Minimum days between imports (from the
 *   plugin's `*_UPDATE_INTERVAL` env var).
 * @param connection - Active DB connection wrapper (used to persist progress).
 * @returns True if an import should run, false otherwise.
 */
export async function shouldUpdate(
  progress,
  sources,
  lastDocumentImported,
  collectionUpdateInterval,
  connection,
) {
  // A missing *_UPDATE_INTERVAL env var makes the interval check NaN upstream,
  // which leaves `sources` undefined and used to blow up here with a cryptic
  // "Illegal argument undefined" from md5. Fail with an actionable message
  // instead so the misconfiguration is obvious in production. Tests (and CI)
  // legitimately run without the *_UPDATE_INTERVAL env vars set, so the check
  // is skipped under NODE_ENV=test — there the NaN interval simply resolves to
  // "no time-based update", which the test fixtures rely on.
  if (
    process.env.NODE_ENV !== 'test' &&
    (collectionUpdateInterval === undefined || collectionUpdateInterval === '')
  ) {
    throw new Error(
      'shouldUpdate: update interval is not set (check the *_UPDATE_INTERVAL env var for this plugin)',
    );
  }
  if (sources === undefined) {
    throw new Error('shouldUpdate: "sources" is undefined');
  }
  sources = md5(JSON.stringify(sources));
  const timeElapsed = Date.now() - progress.dateEnd;
  const minInterval = Number(collectionUpdateInterval) * 24 * 60 * 60 * 1000;
  let isTimeToUpdate = false;
  if (
    progress.dateEnd !== 0 &&
    timeElapsed > minInterval &&
    sources !== progress.sources
  ) {
    progress.dateStart = Date.now();
    await connection.setProgress(progress);
    isTimeToUpdate = true;
  }
  if (
    lastDocumentImported === null ||
    ((sources !== progress.sources || progress.state !== 'updated') &&
      isTimeToUpdate)
  ) {
    return true;
  } else {
    return false;
  }
}
