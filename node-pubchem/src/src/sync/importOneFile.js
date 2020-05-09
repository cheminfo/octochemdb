'use strict';

const fs = require('fs');
const zlib = require('zlib');

const sdfParser = require('sdf-parser');

const improveMoleculePool = require('./improveMoleculePool');

module.exports = async function importOneFile(
  filename,
  pubChemConnection,
  options = {},
) {
  const { firstID = -1, progress = {} } = options;
  const adminCollection = await pubChemConnection.getAdminCollection();
  const collection = await pubChemConnection.getMoleculesCollection();

  let bufferValue = '';
  let newMolecules = 0;

  const readStream = fs.createReadStream(filename);
  const unzipStream = readStream.pipe(zlib.createGunzip());
  for await (const chunk of unzipStream) {
    bufferValue += chunk;
    let lastIndex = bufferValue.lastIndexOf('$$$$');
    if (lastIndex > 0 && lastIndex < bufferValue.length - 5) {
      newMolecules += await parseSDF(bufferValue.substring(0, lastIndex + 5));
      bufferValue = bufferValue.substring(lastIndex + 5);
    }
  }
  newMolecules += await parseSDF(bufferValue);

  return newMolecules;

  async function parseSDF(sdf) {
    const molecules = sdfParser(sdf).molecules;
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
    // save the molecules in the database
    return molecules.length;
  }
};
