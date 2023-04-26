import OCL from 'openchemlib';

import { OctoChemConnection } from '../../utils/OctoChemConnection.js';

async function fixNoStereoID() {
  const connection = new OctoChemConnection();
  const collection = await connection.getCollection('compounds');
  const collectionEntry = await collection.find({});
  let start = Date.now();
  let counter = 0;
  while (await collectionEntry.hasNext()) {
    let entry = await collectionEntry.next();
    let oldNoStereoID = entry?.data.ocl.noStereoID;
    let idCode = entry?.data.ocl.idCode;
    let mol = OCL.Molecule.fromIDCode(idCode);
    mol.stripStereoInformation();
    let newNoStereoID = mol.getIDCode();
    if (Date.now() - start > 1000) {
      console.log(`Fixed ${counter}`);
      start = Date.now();
    }
    if (oldNoStereoID !== newNoStereoID) {
      counter++;
      console.log(`Fixed ${counter}`);
      // updateOne and modify only the noStereoID field
      await collection.updateOne(
        { _id: entry._id },
        { $set: { 'data.ocl.noStereoID': newNoStereoID } },
      );
    } else {
      continue;
    }
  }
}

await fixNoStereoID();
