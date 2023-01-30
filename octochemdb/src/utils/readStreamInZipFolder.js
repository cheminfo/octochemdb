import StreamZip from 'node-stream-zip';

async function readStreamInZipFolder(filePath, fileNameInsideZip) {
  const zip = new StreamZip.async({ file: filePath });

  let keys = Object.values(await zip.entries());
  let fileName;

  for (let key of keys) {
    if (key.name.includes(fileNameInsideZip)) {
      fileName = key;
    }
  }
  if (fileName === undefined) {
    throw new Error('File not found in zip folder');
  }
  const stm = await zip.stream(fileName);
  return stm;
}

export default readStreamInZipFolder;
