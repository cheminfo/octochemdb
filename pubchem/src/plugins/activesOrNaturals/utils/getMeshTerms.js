import Debug from '../../../utils/Debug.js';

import { getMeshTermsType } from './getMeshTermsType.js';
/**
 * @description Get the mesh terms and dbRef for a given cid inside the pubmeds collection
 * @param {*} cid CID
 * @param {*} connection MongoDB connection
 * @returns {Promise} returns an array of objects {meshTerm: array,meshTermsType:array, dbRef: object}
 */
export async function getMeshTerms(cid, collection, connection) {
  const debug = Debug('getMeshTerms');
  try {
    const cursor = await collection.find({
      'data.cids': { $in: [cid] },
    });
    let results = [];
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc.data.meshHeadings) {
        let dbRef = { $ref: 'pubmeds', $id: doc._id };
        let meshTerms = [];
        let meshTermsType = [];
        for (let meshHeading of doc.data.meshHeadings) {
          let type = await getMeshTermsType(meshHeading.descriptorName);
          if (type !== 'other') {
            meshTermsType.push(type);
          }
          meshTerms.push(meshHeading.descriptorName);
        }

        let result = {};
        if (meshTerms.length > 0) {
          result.meshTerms = meshTerms;
        }
        if (meshTermsType.length > 0) {
          result.meshTermsType = meshTermsType;
        }
        result.dbRef = dbRef;
        results.push(result);
      }
    }
    return results;
  } catch (error) {
    if (connection) {
      debug(error, { collection: collection.collectionName, connection });
    }
  }
}
