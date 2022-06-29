// query for molecules from monoisotopic mass
import { getFields, PubChemConnection } from '../../../../server/utils.js';
import Debug from '../../../../utils/Debug.js';

const debug = Debug('articlesFromPMID');

const articlesFromPMID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve article from a PubMed ID',
    description: 'Allows to search for an article from PubMed using PMID',
    querystring: {
      pmid: {
        type: 'number',
        description: 'PubMed ID',
        example: 1,
        default: null,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default:
          'data.cids,data.dateCreated,data.dateCompleted,data.dateRevised,data.article,data.chemicals,data.supplMesh,data.meshHeadings,data.journalInfo',
      },
    },
  },
  handler: searchHandler,
};

export default articlesFromPMID;
/**
 * Find article from PubMed ID
 * @param {object} [request={}]
 * @param {object} [request.query={}]
 * @param {number} [request.query.pmid=1]
 * @param {string} [request.query.fields='data.cids,data.dateCreated,data.dateCompleted,data.dateRevised,data.article,data.chemicals,data.supplMesh,data.meshHeadings,data.journalInfo']
 * @param {number} [request.query.minPubchemEntries=0]
 * @return {Promise<Document[]>}
 */

async function searchHandler(request) {
  let {
    pmid = 1,
    fields = 'data.cids,data.dateCreated,data.dateCompleted,data.dateRevised,data.article,data.chemicals,data.supplMesh,data.meshHeadings,data.journalInfo',
  } = request.query;

  let connection;
  try {
    connection = new PubChemConnection();
    const collection = await connection.getCollection('pubmeds');

    const results = await collection
      .aggregate([
        { $match: { _id: pmid } },
        {
          $project: getFields(fields),
        },
      ])
      .toArray();
    return results[0];
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'pubmeds', connection });
    }
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
