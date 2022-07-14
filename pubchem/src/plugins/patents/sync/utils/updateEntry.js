import Debug from '../../../../utils/Debug.js';

const debug = Debug('updateEntry');

export async function updateEntry(collection, id, patents) {
  let existing = await collection.find({ _id: id }, { _id: 1 }).limit(1);
  if (existing) {
    let result = await collection.updateOne(
      { _id: id },
      {
        $set: { patents, nbPatents: patents.length },
      },
    );

    return result.modifiedCount === 1;
  } else {
    debug(`Entry not found: ${id}`);
    return false;
  }
}
