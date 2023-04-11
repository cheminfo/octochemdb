// query for molecules from monoisotopic mass
import { OctoChemConnection, getFields } from '../../../../server/utils.js';
import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('fromText');

const fromText = {
  method: 'GET',
  schema: {
    summary: 'Retrieve patents which title or abstract contains the given text',
    description: 'Allows to search for patent Title and Abstract.',
    querystring: {
      wordsToSearch: {
        type: 'string',
        description: 'Text to be searched in patent Title and Abstract',
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
    },
  },
  handler: searchHandler,
};

export default fromText;

async function searchHandler(request) {
  let {
    wordsToSearch = '',
    fields = 'data.title, _id, data.abstract',
    minScore = 0,
  } = request.query;
  let formattedFields = getFields(fields);
  formattedFields.score = { $meta: 'textScore' };
  let connection;
  try {
    connection = new OctoChemConnection();
    const collection = await connection.getCollection('uspPatents');
    // right now it returns all entries which have at least one word in the title or abstract
    // add to word this : \"\" using regex
    // concat the string word
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
    const result = await collection
      .aggregate([
        { $match: { $text: { $search: wordsToBeMatched } } },
        { $sort: { score: { $meta: 'textScore' } } },
        { $project: formattedFields },
        { $match: { score: { $gt: minScore } } },
      ])
      .toArray();

    return { data: result };
  } catch (e) {
    if (connection) {
      debug(e.message, {
        collection: 'uspPatents',
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
