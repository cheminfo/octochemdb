'use strict';

const fs = require('fs');

const debug = require('debug')('killCompounds');

module.exports = async function removeEntriesFromFile(
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
      await collection.deleteOne({ _id: killedID });
    }
    debug('removing done');
  }
};
