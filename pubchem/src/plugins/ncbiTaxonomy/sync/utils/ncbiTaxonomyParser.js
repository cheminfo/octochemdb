import { createReadStream } from 'fs';
import ReadLine from 'readline';

export async function ncbiTaxonomyParser(filePath, options = {}) {
  const { callback } = options;
  let readStream = createReadStream(filePath, 'utf-8');
  const readLine = ReadLine.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });
  for await (let line of readLine) {
    const fields = line.split(/[\t ]*\|[ \t]*/);
    if (fields.length < 2) continue;
    const entry = {
      id: fields[0],
      organism: fields[1],
      taxonomy: fields[2].split(/; ?/).filter((field) => field),
    };
    if (callback) callback(entry);
  }
}
