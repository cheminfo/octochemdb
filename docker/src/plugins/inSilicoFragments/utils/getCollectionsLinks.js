import debugLibrary from '../../../utils/Debug.js';

const debug = debugLibrary('getCollectionLinks');

export default async function getCollectionsLinks(connection) {
  try {
    const links = {};

    let collection = await connection.getCollection('activesOrNaturals');

    let results = await collection
      .aggregate([
        {
          $project: {
            _id: 0,
            idCode: '$data.noStereoOCL.idCode',
            noStereoTautomerID: '$_id',
          },
        },
      ])
      .toArray();

    debug.trace(
      `Loaded ${results.length} noStereoTautomerIDs from activesOrNaturals`,
    );
    if (process.env.NODE_ENV === 'test') {
      let test = results.find(
        (result) =>
          result.noStereoTautomerID ===
          'fnc@r@JRUipPQFQQJQYKIQSPiLEUmSUUTu@A@@Zh}`NOta`ZfOacxX',
      );
      results = results.slice(0, 5);
      results.push(test);
    }

    for (const entry of results) {
      if (entry?.idCode) {
        if (!links[entry.noStereoTautomerID]) {
          links[entry.noStereoTautomerID] = {
            id: entry.noStereoTautomerID,
            idCode: entry.idCode,
          };
        }
      }
    }

    return links;
  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
