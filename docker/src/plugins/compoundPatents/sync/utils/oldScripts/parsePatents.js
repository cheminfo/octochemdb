import { createReadStream } from 'fs';

import split2 from 'split2';

import debugLibrary from '../../../../../utils/Debug.js';

import { updateEntry } from './updateEntry.js';

const debug = debugLibrary('parsePatents');
export default async function parsePatents(filename, collection, connection) {
  try {
    const readStream = createReadStream(filename).pipe(split2('\n'));
    const status = { add: 0, change: 0, delete: 0, notFound: 0 };
    for await (const line of readStream) {
      let fields = line.split('\t');
      if (fields.length !== 3) continue;
      const [action, productID, patents] = fields;
      switch (action) {
        case 'ADD':
          status.add++;
          break;
        case 'CHANGE':
          status.change++;
          break;
        case 'DELETE':
          status.delete++;
          break;
        default:
      }
      // @ts-ignore
      status.notFound += !(await updateEntry(
        collection,
        Number(productID),
        patents.split(','),
      ));
      if (
        (status.add + status.change + status.delete + status.notFound) %
          1000 ===
        0
      ) {
        debug(
          `Processing: Add: ${status.add}, Change: ${status.change}, Delete: ${status.delete}, Not found: ${status.notFound}`,
        );
      }
    }
    debug(
      `Finished: Add: ${status.add}, Change: ${status.change}, Delete: ${status.delete}, Not found: ${status.notFound}`,
    );
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'patents', connection, stack: e.stack });
    }
  }
  return true;
}
