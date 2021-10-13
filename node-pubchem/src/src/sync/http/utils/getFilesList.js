'use strict';

const fetch = require('cross-fetch');
const debug = require('debug')('getFilesList');

async function getFilesList(url, options = {}) {
  const { fileFilter = () => true, md5 = false } = options;
  const response = await fetch(url);
  const text = await response.text();
  let files = text
    .split(/\r?\n/)
    .filter((line) => line.match(/^<a/))
    .map((line) => {
      let match = line.match(
        /.*"(?<name>.*)".*(?<date>\d{4}-\d{2}-\d{2}).*(?<time>\d{2}:\d{2})\s*(?<size>\S*)\s*/,
      );
      if (!match) return;
      let groups = match.groups;
      if (groups.size) {
        if (groups.size.endsWith('K')) {
          groups.size = parseInt(groups.size) * 1024;
        } else if (groups.size.endsWith('M')) {
          groups.size = parseInt(groups.size) * 1024 * 1024;
        } else if (groups.size.endsWith('G')) {
          groups.size = parseInt(groups.size) * 1024 * 1024 * 1024;
        } else {
          groups.size = parseInt(groups.size);
        }
      }
      groups.url = `${url}/${groups.name}`;
      groups.epoch = new Date(`${groups.date} ${groups.time}`).getTime();
      return groups;
    })
    .filter((file) => fileFilter(file));

  // we will try to add all the md5 of all the files
  if (md5) {
    for (let file of files) {
      debug(`Get md5 for ${file.name}`);
      const response = await fetch(`${file.url}.md5`);
      file.md5 = (await response.text()).split(' ', 1)[0];
    }
  }
  return files;
}

module.exports = getFilesList;
