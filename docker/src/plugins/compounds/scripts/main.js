import OCL from 'openchemlib';

import debugLibrary from '../../../utils/Debug.js';

const debug = debugLibrary('fixCompounds');
export async function main(connection) {
  try {
    const collection = await connection.getCollection('compounds');
    let start = Date.now();
    let count = 0;
    const cursor = await collection.find({});
    while (await cursor.hasNext()) {
      let currentDoc = await cursor.next();
      if (currentDoc?.data?.ocl?.idCode) {
        const molecule = OCL.Molecule.fromIDCode(currentDoc?.data?.ocl?.idCode);
        const index = molecule.getIndex();
        await collection.updateOne(
          { _id: currentDoc._id },
          { $set: { 'data.ocl.index': index } },
        );
        count++;
      }
      if (Date.now() - start > 60000) {
        debug.info(`Fixed ${count} compounds`);
        start = Date.now();
      }
    }
  } catch (e) {
    debug.info(e);
  }
}
