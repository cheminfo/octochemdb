async function getFilesToImport(connection, progress, allFiles, debug) {
  const collection = await connection.getCollection('bioassay');
  const lastDocument = progress;
  if (!lastDocument.source) return { files: allFiles, lastDocument: {} };

  debug(`last file processed: ${lastDocument.source}`);
  const firstIndex = allFiles.findIndex((n) =>
    n.path.includes(lastDocument.source),
  );

  if (firstIndex === -1) {
    throw new Error(`file not found: ${lastDocument.source}`);
  }

  debug(`starting with file ${lastDocument.source}`);

  return { lastDocument, files: allFiles.slice(firstIndex) };
}
export default getFilesToImport;
