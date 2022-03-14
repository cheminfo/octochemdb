import { createReadStream } from 'fs';
import { join } from 'path';

export async function ncbiTaxonomyConvert(dirPath) {
  let readStream = createReadStream(
    join(dirPath, 'fullnamelineage.dmp'),
    'utf-8',
  );
  let result = [];
  for await (let entry of readStream) {
    let fields = Object.values(entry.split('|').map((string) => string.trim()));
    let entries = {};
    for (let i = 3; i < fields.length; i += 3) {
      entries[fields[i - 3]] = {
        organism: fields[i - 2],
        taxonomy: fields[i - 1].split(';').slice(0, -1),
      };
    }
    result.push(entries);
  }
  // console.log(result[1]);

  return result;
}
