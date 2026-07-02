import md5 from 'md5';

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
  // instead so the misconfiguration is obvious.
  if (
    collectionUpdateInterval === undefined ||
    collectionUpdateInterval === ''
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
