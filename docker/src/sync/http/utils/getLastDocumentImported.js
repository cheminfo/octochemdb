async function getLastDocumentImported(connection, collectionName) {
  const collection = await connection.getCollection(collectionName);
  return collection.find({}).sort({ _id: -1 }).limit(1).next();
}

export default getLastDocumentImported;
