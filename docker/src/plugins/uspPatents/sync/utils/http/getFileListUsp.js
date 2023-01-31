import { fetch } from 'cross-fetch';

async function getFilesListUsp(url, year) {
  const response = await fetch(url);
  const options = {};
  const { fileFilter = () => true } = options;
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
    })
    .filter((file) => fileFilter(file));
  files = JSON.parse(JSON.stringify(files));
  // determine the file size of each file
  for (let file of files) {
    const response = await fetch(file.url);
    const headers = Array.from(response.headers);
    const size = Number(
      headers.filter((row) => row[0] === 'content-length')[0][1],
    );
    file.size = size;
  }
  return files;
}

export default getFilesListUsp;
