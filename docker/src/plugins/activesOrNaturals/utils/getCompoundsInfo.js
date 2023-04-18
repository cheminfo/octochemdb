import debugLibrary from '../../../utils/Debug.js';

import parseCompoundInfo from './parseCompoundInfo.js';

const debug = debugLibrary('getCompoundsInfo');
/**
 * @description Get compounds information compounds collection and data array
 * @param {*} entry Entry from the aggregation process
 * @param {*} data Array of all data for the current noStereoID
 * @param {*} compoundsCollection Compounds collection
 * @param {*} noStereoTautomerID current noStereoTautomerID
 * @param {*} connection OctoChem connection
 * @returns {Promise} Returns the entry with the compounds information
 */
export default async function getCompoundsInfo(
  entry,
  data,
  compoundsCollection,
  noStereoTautomerID,
  connection,
  patentsCollection,
) {
  try {
    let cursor = await compoundsCollection
      .find({ 'data.ocl.noStereoTautomerID': noStereoTautomerID })
      .limit(1);

    let compoundInfo = await cursor.next();
    const parsedCompoundInfo = await parseCompoundInfo(
      compoundInfo,
      entry,
      data,
    );
    const casNumber = parsedCompoundInfo.casNumbers;
    const pmids = parsedCompoundInfo.pmids;
    const meshTerms = parsedCompoundInfo.meshTerms;
    entry = parsedCompoundInfo.entry;
    const compoundsIDs = parsedCompoundInfo.compoundsIds;

    let compoundsPatents;
    let nbPatents = 0;
    let uspPatents = [];
    let uspCollection = await connection.getCollection('uspPatents');
    if (compoundsIDs.length > 0) {
      for (let compound of compoundsIDs) {
        let currentCid = Number(compound);
        let cursor = await patentsCollection.find({ _id: currentCid });
        let patent = await cursor.next();
        if (patent !== null) {
          compoundsPatents = patent.data.patents;
          nbPatents += patent.data.nbPatents;
        }
        let uspCursor = await uspCollection.find({
          'data.cids': { $exists: true, $in: [currentCid] },
        });

        while (await uspCursor.hasNext()) {
          let uspPatent = await uspCursor.next();
          if (uspPatent !== null) {
            uspPatents.push({ $ref: 'uspPatents', $id: uspPatent._id });
          }
        }
      }
    }

    if (nbPatents > 0) {
      entry.data.nbPatents = nbPatents;
    }
    if (compoundsPatents?.length > 0) {
      entry.data.patents = compoundsPatents;
    }
    if (uspPatents.length > 0) {
      entry.data.uspPatents = uspPatents;
      entry.data.nbUspPatents = uspPatents.length;
    }
    if (compoundsIDs.length > 0) entry.data.cids = compoundsIDs;
    if (casNumber.length > 0) entry.data.cas = casNumber;
    if (pmids.length > 0) {
      entry.data.pmids = pmids;
    }
    if (meshTerms.length > 0) entry.data.meshTerms = meshTerms;
    return entry;
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
