import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';

import Debug from 'debug';
import { XMLParser } from 'fast-xml-parser';

import improvePubmed from './improvePubmed.js';

const debug = Debug('importOnePubmedFile');

export default async function importOnePubmedFile(
  connection,
  progress,
  file,
  options,
) {
  const collection = await connection.getCollection('pubmeds');

  debug(`Importing: ${file.name}`);
  // should we directly import the data how wait that we reach the previously imported information
  let { shouldImport = true, lastDocument } = options;
  let inflated = gunzipSync(readFileSync(file.path));
  const decoder = new TextDecoder();
  inflated = decoder.decode(inflated);

  const parser = new XMLParser({
    textNodeName: '_text',
    attributeNameProcessor: (name) => {
      if (name.match(/^[A-Z]+$/)) {
        return name.toLowerCase();
      } else if (name.match(/^[A-Z]/)) {
        return name.toLowerCase() + name.substring(1);
      }
      return name;
    },
  });

  const parsed = parser.parse(inflated);

  let pubmeds = parsed.PubmedArticleSet.PubmedArticle;
  if (process.env.TEST === 'true') pubmeds = pubmeds.slice(0, 10);

  let imported = 0;
  debug(`Need to process ${pubmeds.length} pubmeds`);
  for (let pubmed of pubmeds) {
    let medlineCitation = pubmed.MedlineCitation;
    if (!medlineCitation) throw new Error('citation not found', pubmed);
    if (!shouldImport) {
      if (medlineCitation.PMID !== lastDocument._id) {
        continue;
      }
      shouldImport = true;
      debug(`Skipping pubmeds till: ${lastDocument._id}`);
      continue;
    }
    const article = improvePubmed(medlineCitation);
    article._seq = ++progress.seq;
    article._source = file.path.replace(process.env.ORIGINAL_DATA_PATH, '');
    await collection.updateOne(
      { _id: article._id },
      { $set: article },
      { upsert: true },
    );
    connection.setProgress(progress);
    imported++;
  }
  debug(`${imported} pubmeds processed`);
  // save the pubmeds in the database
  return pubmeds.length;
}
