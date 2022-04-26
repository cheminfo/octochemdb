import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';

import { XMLParser } from 'fast-xml-parser';

import Debug from '../../../../utils/Debug.js';

import improvePubmed from './improvePubmed.js';

const debug = Debug('importOnePubmedFile');

export default async function importOnePubmedFile(
  connection,
  progress,
  file,
  options,
) {
  const collection = await connection.getCollection('pubmeds');
  await collection.createIndex({ _seq: 1 });
  debug(`Importing: ${file.name}`);
  const logs = await connection.geImportationtLog({
    collectionName: 'pubmeds',
    sources: file.name,
    startSequenceID: progress.seq,
  });
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
  let start = Date.now();
  for (let pubmed of pubmeds) {
    let medlineCitation = pubmed.MedlineCitation;
    if (!medlineCitation) throw new Error('citation not found', pubmed);
    if (!shouldImport) {
      if (medlineCitation.PMID !== lastDocument._id) {
        continue;
      }
      shouldImport = true;
      if (Date.now() - start > Number(process.env.DEBUG_THROTTLING || 10000)) {
        debug(`Skipping pubmeds till: ${lastDocument._id}`);
        start = Date.now();
        continue;
      }
    }
    const article = improvePubmed(medlineCitation);
    article._seq = ++progress.seq;
    progress.sources = file.path.replace(process.env.ORIGINAL_DATA_PATH, '');
    await collection.updateOne(
      { _id: article._id },
      { $set: article },
      { upsert: true },
    );
    await connection.setProgress(progress);
    imported++;
  }
  logs.dateEnd = Date.now();
  logs.endSequenceID = progress.seq;
  logs.status = 'updated';
  await connection.updateImportationLog(logs);
  debug(`${imported} pubmeds processed`);
  // save the pubmeds in the database
  return pubmeds.length;
}
