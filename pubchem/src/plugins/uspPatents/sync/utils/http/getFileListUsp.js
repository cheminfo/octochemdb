import fetch from 'cross-fetch';

async function getFilesListUsp(url, year) {
  const response = await fetch(url);

  const text = await response.text();
  let files = text
    .split(/\r?\n/)
    .filter((line) => line.match(/\t<tr>/))
    .map((line) => {
      let match = line.match(/.*href="(?<href>.*)">(?<name>.*)<\/a>/);
      if (!match) return undefined;
      let groups = match.groups;
      if (match.groups.name) {
        groups.url = `${url}${match.groups.name}`;
        groups.epoch = new Date(`${year}`).getTime();
      }
      return groups;
    });

  return files;
}

export default getFilesListUsp;
