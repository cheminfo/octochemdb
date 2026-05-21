import md5 from 'md5';

export async function shouldUpdate(
  progress,
  sources,
  lastDocumentImported,
  collectionUpdateInterval,
  connection,
) {
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
