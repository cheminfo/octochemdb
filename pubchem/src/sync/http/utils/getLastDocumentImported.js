async function getLastDocumentImported(connection, progress, collectionName) {
  const collection = await connection.getCollection(collectionName);
  return collection
    .find({ _seq: { $lte: progress.seq } })
    .sort('_seq', -1)
    .limit(1)
    .next();
}

export default getLastDocumentImported;
