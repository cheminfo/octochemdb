import Debug from '../../../../utils/Debug.js';

const debug = Debug('getTaxonomiesNodes');
export function getTaxonomiesNodes(arrayBuffer, connection) {
  try {
    const decoder = new TextDecoder();
    arrayBuffer = new Uint8Array(arrayBuffer);
    let begin = 0;
    let end = 0;
    let result = {};

    while (end < arrayBuffer.length) {
      if (arrayBuffer[end] === 10) {
        const line = decoder.decode(arrayBuffer.subarray(begin, end));
        const fields = line.split(/[\t ]*\|[ \t]*/);

        if (fields.length < 2) {
          end++;
          continue;
        }

        let taxId = fields[0].replace(/[\r\n]/g, '');
        result[taxId] = fields[2];
        begin = end;
      }
      end++;
    }

    return result;
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'taxonomies', connection });
    }
  }
}
