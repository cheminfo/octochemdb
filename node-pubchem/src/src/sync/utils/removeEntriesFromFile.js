import fs from 'fs';

import Debug from 'debug';

const debug = Debug('removeEntriesFromFile');

export default async function removeEntriesFromFile(
  connection,
  collectionName,
  file,
) {
  const fileSource = file.path.replace(process.env.ORIGINAL_DATA_PATH, '');

  debug(`Processing: ${fileSource}`);

  const collection = await connection.getCollection(collectionName);

  const killedFile = fs.readFileSync(file.path, 'ascii');
  const killed = killedFile.split(/\r?\n/).map(Number);
  if (killed) {
    debug(`removing ${killed.length} killed IDs`);
    let reallyRemoved = 0;

    const progress = await connection.getProgress(collectionName);

    for (const killedID of killed) {
      let entry = await collection.findOne({ _id: Number(killedID) });
      console.log(entry);
      if (!entry) {
        entry = { _id: killedID };
      } else {
        reallyRemoved++;
      }
      entry._source = fileSource;
      entry._seq = ++progress.seq;
      for (let key in entry) {
        if (key.startsWith('_')) continue;
        delete entry[key];
      }
      await collection.updateOne(
        { _id: entry._id },
        { $set: entry },
        { upsert: true },
      );
    }
    debug(`removal of ${reallyRemoved} existing entris done`);
  }
}
