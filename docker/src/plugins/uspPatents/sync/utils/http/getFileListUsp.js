import delay from 'delay';

import debugLibrary from '../../../../../utils/Debug.js';

async function getFilesListUsp(url, year, options = {}) {
  const debug = debugLibrary('getFileListUsp');
  try {
    let response;
    let text;
    let counter = 0;
    while (true) {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1800 * 1000);
        response = await fetch(`${url}${year}`, { signal: controller.signal });
        text = await response.text();
        if (response?.status === 200) {
          break;
        }
      } catch (e) {
        if (counter++ > 10) {
          debug(e);
        }
        await delay(10000);
      }
    }
    const { fileFilter = () => true } = options;

    //console.log('text', text);
    let files = text
      .split(/\r?\n/)
      .filter((line) => line.match(/\t<tr>/))
      .map((line) => {
        let match = line.match(/.*href="(?<href>.*)">(?<name>.*)<\/a>/);
        // console.log('match', match);
        if (!match) return undefined;
        // groups object key are unprototype
        let groups = match.groups;
        if (match.groups.name && match.groups.name.endsWith('.zip')) {
          groups.url = `${url}${year}/${match.groups.name}`;
          groups.epoch = new Date(`${year}`).getTime();
        }
        return groups;
      })
      .filter((file) => fileFilter(file));
    files = JSON.parse(JSON.stringify(files));

    // determine the file size of each file
    for (let file of files) {
      let responseFile;
      let count = 0;
      while (true) {
        try {
          responseFile = await fetch(file.url);
          break;
        } catch (e) {
          if (count++ > 10) {
            throw e;
          }
          await delay(10000);
        }
      }
      const headers = Array.from(responseFile.headers);
      const size = Number(
        headers.filter((row) => row[0] === 'content-length')[0][1],
      );
      file.size = size;
    }
    return files;
  } catch (e) {
    debug(e);
  }
}

export default getFilesListUsp;
