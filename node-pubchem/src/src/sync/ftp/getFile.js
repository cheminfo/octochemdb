'use strict';

const ftp = require('basic-ftp');
const fs = require('fs-extra');
const tempfile = require('tempfile');

module.exports = async function getFile(ftpHost, ftpDirectory, destinationFolder, file) {
  const client = new ftp.Client();
  await client.access({
    host: ftpHost
  });
  await client.cd(ftpDirectory);

  let destinationFile = `${destinationFolder}/${file}`;

  if (fs.existsSync(destinationFile)) return;

  console.log(`Downloading ${destinationFile}`);

  let tmpFileName = tempfile();
  const outputFile = fs.createWriteStream(tmpFileName);
  await client.download(outputFile, file);
  outputFile.end();
  fs.moveSync(tmpFileName, destinationFile);
  fs.removeSync(tmpFileName);
  client.close();
};
