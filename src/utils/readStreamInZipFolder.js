/* eslint-disable new-cap */

import StreamZip from 'node-stream-zip';

async function readStreamInZipFolder(filePathZip, fileNameInZip) {
  const zip = new StreamZip.async({ file: filePathZip });
  const entries = await zip.entries();
  const pathFileInZip = Object.keys(entries).find((key) =>
    key.includes(fileNameInZip),
  );
  const stm = await zip.stream(pathFileInZip);
  return stm;
}

export default readStreamInZipFolder;
