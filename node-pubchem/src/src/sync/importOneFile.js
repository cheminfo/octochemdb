'use strict';

const zlib = require('zlib');

const fs = require('fs-extra');
const sdfParser = require('sdf-parser');

const improveMoleculePool = require('./improveMoleculePool');

const kHalfStringMaxLength = 268435440 / 2;

module.exports = async function importOneFile(
  filename,
  pubChemConnection,
  options = {},
) {
  const { firstID = -1, progress = {} } = options;
  const adminCollection = await pubChemConnection.getAdminCollection();
  const collection = await pubChemConnection.getMoleculesCollection();

  const gzValue = await fs.readFile(filename);
  const bufferValue = zlib.gunzipSync(gzValue);
  let n = 0;
  let nextIndex = 0;
  let newMolecules = 0;

  while (n < bufferValue.length) {
    nextIndex = bufferValue.indexOf('$$$$', n + kHalfStringMaxLength);
    if (nextIndex === -1) nextIndex = bufferValue.length;
    const strValue = bufferValue.slice(n, nextIndex).toString();
    const molecules = sdfParser(strValue).molecules;

    const actions = [];

    for (let molecule of molecules) {
      if (molecule.PUBCHEM_COMPOUND_CID <= firstID) continue;

      actions.push(
        improveMoleculePool(molecule)
          .then((result) => {
            result.seq = ++progress.seq;
            return collection.updateOne(
              { _id: result._id },
              { $set: result },
              { upsert: true },
            );
          })
          .then(() => {
            return adminCollection.updateOne(
              { _id: progress._id },
              { $set: progress },
            );
          }),
      );
    }
    newMolecules += actions.length;
    await Promise.all(actions);
    n = nextIndex;
  }
  return newMolecules;
};
