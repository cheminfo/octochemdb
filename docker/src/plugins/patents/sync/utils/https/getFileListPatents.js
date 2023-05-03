import delay from 'delay';

import debugLibrary from '../../../../../utils/Debug.js';

async function getFileListPatents(url, options = {}) {
  const debug = debugLibrary('getFileListPatents');
  try {
    let response;
    let text;
    let counter = 0;

    while (true) {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1800 * 1000);
        response = await fetch(`${url}`, { signal: controller.signal });
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
      .map((line) => {
        let match = line.match(/.*href="(?<href>.*)">(?<name>.*)<\/a>/);
        // console.log('match', match);
        if (!match) return undefined;
        // groups object key are unprototype
        let groups = match.groups;
        // check if the match group has pc_patent2abstract_ or pc_patent2title_
        if (
          (match.groups.name &&
            match.groups.name.startsWith('pc_patent2title_')) ||
          (match.groups.name &&
            match.groups.name.startsWith('pc_patent2abstract_'))
        ) {
          groups.url = `${url}${match.groups.name}`;
        }
        return groups;
      })
      .filter((file) => fileFilter(file));
    files = JSON.parse(JSON.stringify(files));

    let abstracts2Download = [];
    let titles2Download = [];
    for (let file of files) {
      if (file?.url) {
        if (file.name.startsWith('pc_patent2abstract_')) {
          abstracts2Download.push(file);
        }
        if (file.name.startsWith('pc_patent2title_')) {
          titles2Download.push(file);
        }
      } else {
        continue;
      }
    }
    return { abstracts2Download, titles2Download };
  } catch (e) {
    debug(e);
  }
}

export default getFileListPatents;
