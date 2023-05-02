// query for molecules from monoisotopic mass
import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromText');

const fromText = {
  method: 'GET',
  schema: {
    summary:
      'Retrieve articles which title, MeSH terms or abstract contains the given text',
    description: 'Allows to search for articles Title and Abstract.',
    querystring: {
      wordsToSearch: {
        type: 'string',
        description:
          'Text to be searched in articles Title, Abstract or MeSH terms',
        example: 'antibiotic',
        default: '',
      },
      fields: {
        type: 'string',
        description: 'Fields to retrieve',
        default: 'data',
      },
      minScore: {
        type: 'number',
        description: 'Text search score minimum',
        example: 2,
        default: 1,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return',
        example: 200,
        default: 100,
      },
    },
  },
  handler: searchHandler,
};

export default fromText;

async function searchHandler(request) {
  let {
    wordsToSearch = '',
    fields = 'data.article.title, _id, data.article.abstract,data.meshHeadings',
    minScore = 0,
    limit = 100,
  } = request.query;
  let formattedFields = getFields(fields);
  debug(formattedFields);
  formattedFields.score = { $meta: 'textScore' };
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('pubmeds');
    let wordsToBeMatched = '';

    let words = wordsToSearch
      .toLowerCase()
      .split(/ *[,;\t\n\r\s]+ */)
      .filter((entry) => entry);
    for (let word of words) {
      // eslint-disable-next-line no-useless-escape
      word = `\"${word}\"`;
      wordsToBeMatched = wordsToBeMatched.concat(word, ' ');
    }
    debug(wordsToBeMatched);
    const result = await collection
      .aggregate([
        { $match: { $text: { $search: wordsToBeMatched } } },
        { $project: formattedFields },
        { $match: { score: { $gt: minScore } } },
        { $limit: Number(limit) },
      ])
      .toArray();

    return { data: result };
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'pubmeds',
        connection,
        stack: e.stack,
      });
    }
    return { errors: [{ title: e.message, detail: e.stack }] };
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
}
