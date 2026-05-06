import debugLibrary from '../../../utils/Debug.js';

/**
 * Retrieve MeSH terms and PubMed IDs linked to the given compound DBRefs.
 * @param {DbRef[]} cids - compound DBRefs
 * @param {import('mongodb').Collection} collection - pubmeds collection
 * @param {OctoChemConnection} connection
 * @returns {Promise<MeshTermsResult | undefined>}
 */
export async function getMeshTerms(cids, collection, connection) {
  const debug = debugLibrary('getMeshTerms');

  try {
    const result = await collection
      .aggregate([
        {
          $match: {
            'data.compounds': {
              $in: cids,
            },
          },
        },
        {
          $limit: 50000,
        },
      ])
      .toArray();
    let uniqueMeshTerms = {};
    let pmids = [];
    for (let doc of result) {
      if (doc.data?.meshHeadings) {
        for (let meshHeading of doc.data.meshHeadings) {
          if (meshHeading.descriptorName) {
            const descriptorName = meshHeading.descriptorName.toLowerCase();
            uniqueMeshTerms[descriptorName] = true;
          }
        }
        pmids.push(doc._id);
      }
    }

    const counterPmids = pmids.length;
    return {
      meshTermsForCid: Object.keys(uniqueMeshTerms),
      pmIds: pmids,
      counterPmids,
    };
  } catch (/** @type {any} */ error) {
    if (connection) {
      await debug.fatal(error.message, {
        collection: collection.collectionName,
        connection,
        stack: error.stack,
      });
    }
  }
}
