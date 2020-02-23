'use strict';

const fs = require('fs-extra');
const ftp = require('basic-ftp');
const arrayDifference = require('array-difference');
const tempfile = require('tempfile');

module.exports = async function syncFolder(
  ftpHost,
  ftpDirectory,
  destinationFolder,
) {
  const client = new ftp.Client();
  await client.access({
    host: ftpHost,
  });

  await client.cd(ftpDirectory);

  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirpSync(destinationFolder);
  }

  let ftpFiles = (await client.list())
    .map((f) => f.name)
    .filter((f) => f.endsWith('sdf.gz'));
  let localFiles = (await fs.readdir(destinationFolder)).filter((f) =>
    f.endsWith('sdf.gz'),
  );

  let difference = arrayDifference(ftpFiles, localFiles);
  for (let file of difference) {
    console.log(`Downloading ${file}`);
    let tmpFileName = tempfile();
    const outputFile = fs.createWriteStream(tmpFileName);
    try {
      await client.download(outputFile, file);
      outputFile.end();
      fs.moveSync(tmpFileName, `${destinationFolder}/${file}`);
      fs.removeSync(tmpFileName);
    } catch (error) {
      console.trace(error);
      throw new Error(`Error download ${file} to tmpFileName`);
    }
  }

  client.close();
};
