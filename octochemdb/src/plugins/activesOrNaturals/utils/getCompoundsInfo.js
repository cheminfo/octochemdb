import OCL from 'openchemlib';

import debugLibrary from '../../../utils/Debug.js';
//import { fetchPatentsTitles } from '../../../utils/fetchPatentsTitles.js';
import { getCompoundsData } from '../../compounds/sync/utils/getCompoundsData.js';

const debug = debugLibrary('getCompoundsInfo');
/**
 * @description Get compounds information compounds collection and data array
 * @param {*} entry Entry from the aggregation process
 * @param {*} data Array of all data for the current noStereoID
 * @param {*} compoundsCollection Compounds collection
 * @param {*} noStereoTautomerID current noStereoTautomerID
 * @param {*} connection PubChem connection
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
    let cids = {};
    let cas = {};
    let pmids = [];
    let meshTerms = [];
    for (const info of data) {
      if (info.data.pmids) {
        pmids.push(info.data.pmids.filter((k) => pmids.indexOf(k) === -1));
      }
      if (info.data.meshTerms) {
        meshTerms.push(
          info.data.meshTerms.filter((k) => meshTerms.indexOf(k) === -1),
        );
      }

      if (info.data.cid) {
        cids[info.data.cid] = true;
      }
      if (info.data.cas) {
        cas[info.data.cas] = true;
      }
    }
    let bioActive = false;
    let cursor = await compoundsCollection
      .find({ 'data.ocl.noStereoTautomerID': noStereoTautomerID })
      .limit(1);

    let compoundInfo = await cursor.next();

    if (compoundInfo !== null) {
      entry.data.em = compoundInfo.data.em;
      entry.data.charge = compoundInfo.data.charge;
      entry.data.unsaturation = compoundInfo.data.unsaturation;
      entry.data.mf = compoundInfo.data.mf;
      entry.data.bioActive = bioActive;
      cids[compoundInfo._id] = true;
    }
    if (compoundInfo?.data?.em === undefined) {
      const molecule = OCL.Molecule.fromIDCode(noStereoTautomerID);
      const smiles = molecule.toSmiles();
      let compoundData = await getCompoundsData(molecule);
      entry.data.smiles = smiles;
      entry.data.em = compoundData?.data.em;
      entry.data.charge = compoundData?.data.charge;
      entry.data.unsaturation = compoundData?.data.unsaturation;
      entry.data.mf = compoundData?.data.mf;
      entry.data.bioActive = bioActive;
    }
    cids = Object.keys(cids);
    let compoundsPatents = [];
    //let patentsTitles = {};
    let nbPatents = 0;
    if (cids.length > 0) {
      for (let compound of cids) {
        let currentCid = Number(compound);
        let cursor = await patentsCollection.find({ _id: currentCid });
        let patent = await cursor.next();
        if (patent !== null) {
          // merge array compoundsPatents with patent.data.patents
          compoundsPatents = compoundsPatents.concat(patent.data.patents);
          /*for (let id of compoundsPatents) {
            patentsTitles[id] = await fetchPatentsTitles(id);
          }*/
          nbPatents += patent.data.nbPatents;
        }
      }
    }
    cids.map(Number);
    cas = Object.keys(cas);
    if (nbPatents > 0) {
      entry.data.nbPatents = nbPatents;
    }
    /*if (patentsTitles.length > 0) {
      entry.data.patentsTitles = patentsTitles;
    }*/
    if (compoundsPatents.length > 0) {
      entry.data.patents = compoundsPatents;
    }
    if (cids.length > 0) entry.data.cids = cids;
    if (cas.length > 0) entry.data.cas = cas;
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
