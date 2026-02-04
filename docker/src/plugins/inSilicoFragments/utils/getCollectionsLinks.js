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
            noStereoId: '$data.noStereoOCL',
            noStereoTautomerID: '$_id',
          },
        },
      ])
      .toArray();

    debug.trace(
      `Loaded ${results.length} noStereoTautomerIDs from activesOrNaturals`,
    );
    if (process.env.NODE_ENV === 'test') {
      const noStereoTautomersForTest = [
        'fikAP@@\\TT^RJJJISHsIISIRlfmATEQUSUQ@AkrvGXCbNBx{b^Ota`zvOacxX',
        'fikAP@@\\TT^RJJJISHsIISIRlfmATEQUSUQ@AkrvGXCbNBx{b^Ota`zvOacxX',
        'eodPF@@@FMHjgldTbbdTVRNTQVdrvDlBrzFNnjjjjjjjjjjj`@MUJLLXTqi`KBvClWXAqCc}LLXjX~FOamJfOacxYzecxX~F@',
        'eodPF@@@FMHjgldTbbdTVRNTQVdrvDlBrzFNnjjjjjjjjjjj`@MUJLLXTqi`KBvClWXAqCc}LLXjX~FOamJfOacxYzecxX~F@',
        'ebQVJDDLAKBel]GO@i`@bDHlgsldTRbRRRfbebbRbbrVIGEC@qsrHLMUUUUUAQEQUUTT@Ajea`cGFALRXTqibsGf@lYXJqMa[GvD\\XxIq~bFZNLFOacxYrecxX~F@',
        'flu@P@@X\\eJYm]enrTdkpZjjjjjj`@uLcFLDqsAlVp{GlAqGB\\Eq~bLqRq|L_CNiX~FOa`',
      ];
      results = results.filter((entry) =>
        noStereoTautomersForTest.includes(entry.noStereoTautomerID),
      );
    }
    for (const entry of results) {
      if (Array.isArray(entry.noStereoId)) {
        for (const idCodeObj of entry.noStereoId) {
          if (!links[entry.noStereoTautomerID]) {
            links[entry.noStereoTautomerID] = [];
          }
          links[entry.noStereoTautomerID].push({
            noStereoId: idCodeObj.idCode,
            noStereoTautomerID: entry.noStereoTautomerID,
          });
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
