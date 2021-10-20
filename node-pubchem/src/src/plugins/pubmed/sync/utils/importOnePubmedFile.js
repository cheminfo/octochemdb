import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';

import { parse } from 'arraybuffer-xml-parser';
import Debug from 'debug';

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
  let newPubmeds = 0;

  const gzFile = readFileSync(file.path);
  const inflated = gunzipSync(gzFile);
  console.log(inflated.length);
  const parsed = parse(inflated, { textNodeName: '_text' });
  console.log(parsed);

  debug(`Need to process ${pubmeds.length} pubmeds`);

  let pubmeds = parsed.PubmedArticleSet.PubmedArticle;
  if (process.env.TEST === 'true') pubmeds = pubmeds.slice(0, 10);

  console.log(pubmeds);

  for (let pubmed of pubmeds) {
    let pubmedCitation = pubmed.PubmedCitation;
    if (!shouldImport) {
      if (pubmedCitation.PMID._text !== lastDocument._id) {
        continue;
      }
      shouldImport = true;
      debug(`Skipping pubmeds till: ${lastDocument._id}`);
      continue;
    }

    const article = improvePubmed(pubmedCitation);
    article._seq = ++progress.seq;
    article._source = file.path.replace(process.env.ORIGINAL_DATA_PATH, '');
    await collection.updateOne(
      { _id: article._id },
      { $set: pubmed },
      { upsert: true },
    );
    connection.setProgress(progress);
    newPubmeds;
  }
  // save the pubmeds in the database
  return pubmeds.length;
}
