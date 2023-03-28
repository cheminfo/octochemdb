// query for molecules from monoisotopic mass
import { getFields, OctoChemConnection } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromPMID');

const fromPMID = {
  method: 'GET',
  schema: {
    summary: 'Retrieve article from a PubMed ID',
    description: 'Allows to search for an article from PubMed using PMID',
    querystring: {
      pmid: {
        type: 'number',
        description: 'PubMed ID',
        example: 1,
        default: 1,
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data.article.title,data.cids',
      },
    },
  },
  handler: searchHandler,
};

export default fromPMID;
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
  let { pmid = 1, fields = 'data.article.title,data.cids' } = request.query;

  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('pubmeds');

    const results = await collection
      .aggregate([
        { $match: { _id: pmid } },
        {
          $project: getFields(fields),
        },
      ])
      .toArray();
    return { data: results[0] };
  } catch (e) {
    if (connection) {
      debug(e.message, { collection: 'pubmeds', connection, stack: e.stack });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
