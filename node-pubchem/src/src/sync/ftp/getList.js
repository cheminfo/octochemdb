'use strict';

const ftp = require('basic-ftp');

module.exports = async function syncFolder(ftpHost, ftpDirectory) {
  const client = new ftp.Client();

  await client.access({
    host: ftpHost,
  });
  await client.cd(ftpDirectory);
  let ftpFiles = (await client.list()).map((f) => f.name);

  client.close();
  return ftpFiles;
};
