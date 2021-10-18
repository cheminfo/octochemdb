import fs from 'fs';

import Debug from 'debug';

const debug = Debug('removeEntriesFromFile');

export default async function removeEntriesFromFile(
  connection,
  collectionName,
  file,
) {
  debug(`Processing: ${file.name}`);

  const collection = await connection.getCollection(collectionName);

  const killedFile = fs.readFileSync(file.path, 'ascii');
  const killed = killedFile.split(/\r?\n/).map(Number);
  if (killed) {
    debug(`removing ${killed.length} killed IDs`);
    for (const killedID of killed) {
      const entry = await collection.findOne({ _id: killedID });
      if (entry) {
        // we remove all the properties
      }
    }
    debug('removing done');
  }
}
