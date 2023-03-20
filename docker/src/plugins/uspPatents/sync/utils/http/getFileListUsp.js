import delay from 'delay';

async function getFilesListUsp(url, year) {
  let response = await fetch(`${url}${year}`);
  let count = 0;
  while (!response.ok && count < 3) {
    delay(1000);
    response = await fetch(`${url}${year}`);
    count++;
  }
  const options = {};
  const { fileFilter = () => true } = options;
  const text = await response.text();
  let files = text
    .split(/\r?\n/)
    .filter((line) => line.match(/\t<tr>/))
    .map((line) => {
      let match = line.match(/.*href="(?<href>.*)">(?<name>.*)<\/a>/);
      if (!match) return undefined;
      // groups object key are unprototype
      let groups = match.groups;
      if (match.groups.name) {
        groups.url = `${url}${year}/${match.groups.name}`;
        groups.epoch = new Date(`${year}`).getTime();
      }
      return groups;
    })
    .filter((file) => fileFilter(file));
  files = JSON.parse(JSON.stringify(files));
  // determine the file size of each file
  for (let file of files) {
    let responseFile = await fetch(file.url);
    let counter = 0;
    while (!responseFile.ok && counter < 3) {
      delay(1000);
      responseFile = await fetch(file.url);
      counter++;
    }
    const headers = Array.from(responseFile.headers);
    const size = Number(
      headers.filter((row) => row[0] === 'content-length')[0][1],
    );
    file.size = size;
  }
  return files;
}

export default getFilesListUsp;
