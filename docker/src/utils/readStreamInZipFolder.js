/* eslint-disable new-cap */
import StreamZip from 'node-stream-zip';

async function readStreamInZipFolder(fileToRead) {
  // split after 'zip' and add 'zip' again

  const filePathZip = fileToRead.relativePath.split('.zip')[0].concat('.zip');
  const zip = new StreamZip.async({ file: filePathZip });
  const stm = await zip.stream(fileToRead.relativePath.split('.zip/')[1]);
  return stm;
}

export default readStreamInZipFolder;
