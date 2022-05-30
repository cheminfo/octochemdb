import Debug from '../../../../utils/Debug.js';

const debug = Debug('parseTaxonomies');

export function* parseTaxonomies(arrayBuffer, nodes, connection) {
  try {
    const decoder = new TextDecoder();
    arrayBuffer = new Uint8Array(arrayBuffer);
    let begin = 0;
    let end = 0;
    while (end < arrayBuffer.length) {
      if (arrayBuffer[end] === 10) {
        const line = decoder.decode(arrayBuffer.subarray(begin, end));

        const fields = line.split(/[\t ]*\|[ \t]*/);
        if (fields.length < 2) {
          end++;
          continue;
        }

        let taxonomy = {};
        if (fields[9] !== '') {
          taxonomy.superkingdom = fields[9];
        }
        if (fields[8] !== '') {
          taxonomy.kingdom = fields[8];
        }
        if (fields[7] !== '') {
          taxonomy.phylum = fields[7];
        }
        if (fields[6] !== '') {
          taxonomy.class = fields[6];
        }
        if (fields[5] !== '') {
          taxonomy.order = fields[5];
        }
        if (fields[4] !== '') {
          taxonomy.family = fields[4];
        }
        if (fields[3] !== '') {
          taxonomy.genus = fields[3];
        }
        if (fields[2] !== '') {
          taxonomy.species = fields[2];
        }
        if (fields[1] !== '') {
          let taxId = Number(fields[0]);
          let rank = nodes[taxId];

          if (
            [
              'superkingdom',
              'species',
              'genus',
              'class',
              'phylum',
              'family',
              'kingdom',
            ].includes(rank)
          ) {
            taxonomy[rank] = fields[1];
          }
        }
        const entry = {
          _id: Number(fields[0].replace(/[\r\n]/g, '')),
          data: taxonomy,
        };

        yield entry;
        begin = end;
      }
      end++;
    }
    return;
  } catch (e) {
    if (connection) {
      debug(e, { collection: 'taxonomies', connection });
    }
  }
}
