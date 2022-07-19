import Debug from '../../../utils/Debug.js';
import { getCompoundsData } from '../../compounds/sync/utils/getCompoundsData.js';

const debug = Debug('getCompoundsInfo');
/**
 * @description Get compounds information compounds collection and data array
 * @param {*} entry Entry from the aggregation process
 * @param {*} data Array of all data for the current noStereoID
 * @param {*} compoundsCollection Compounds collection
 * @param {*} noStereoID current noStereoID
 * @param {*} connection PubChem connection
 * @returns {Promise} Returns the entry with the compounds information
 */
export default async function getCompoundsInfo(
  entry,
  data,
  compoundsCollection,
  noStereoID,
  connection,
  // patentsCollection,
) {
  try {
    let patents = [];
    let cid = {};
    let cas = {};
    let pmids = [];
    let meshTerms = [];
    for (const info of data) {
      /* if (info.data.patents) {
        patents.push(
          info.data.patents.filter((k) => patents.indexOf(k) === -1),
        );
      }*/
      if (info.data.pmids) {
        pmids.push(info.data.pmids.filter((k) => pmids.indexOf(k) === -1));
      }
      if (info.data.meshTerms) {
        meshTerms.push(
          info.data.meshTerms.filter((k) => meshTerms.indexOf(k) === -1),
        );
      }

      if (info.data.cid) {
        cid[info.data.cid] = true;
      }
      if (info.data.cas) {
        cas[info.data.cas] = true;
      }
    }
    let bioActive = false;
    let cursor = await compoundsCollection
      .find({ 'data.ocl.noStereoID': noStereoID })
      .limit(1);

    let compoundInfo = await cursor.next();

    if (compoundInfo !== null) {
      entry.data.em = compoundInfo.data.em;
      entry.data.charge = compoundInfo.data.charge;
      entry.data.unsaturation = compoundInfo.data.unsaturation;
      entry.data.mf = compoundInfo.data.mf;
      entry.data.bioActive = bioActive;
      cid[compoundInfo._id] = true;
    }
    if (compoundInfo === null) {
      const molecule = { noStereoID: noStereoID };
      let compoundData = await getCompoundsData(molecule);
      entry.data.em = compoundData.data.em;
      entry.data.charge = compoundData.data.charge;
      entry.data.unsaturation = compoundData.data.unsaturation;
      entry.data.mf = compoundData.data.mf;
      entry.data.bioActive = bioActive;
    }
    cid = Object.keys(cid);
    // let patentsForCid = [];
    /* if (cid.length > 0) {
      for (let i = 0; i < cid.length; i++) {
        let cid = Number(cid[i]);
        let cursor = await patentsCollection.find({ _id: cid });
        let patent = await cursor.next();
        if (patent !== null) {
          patentsForCid = patentsForCid.concat(patent.data);
        }
      }
    }*/
    cid.map(Number);
    cas = Object.keys(cas);
    /* if (patentsForCid.length > 0) {
      entry.data.patents = patentsForCid;
    }*/
    if (cid.length > 0) entry.data.cids = cid;
    if (cas.length > 0) entry.data.cas = cas;
    if (patents.length > 0) entry.data.patents = patents;
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
