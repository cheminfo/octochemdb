import { createReadStream } from 'fs';
import * as readline from 'readline';
export async function* parseRelations(cidTopmid, cidTosid, cidTopatent) {
  const readStream = createReadStream(cidTosid);
  let cids = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });
  let lastCid = 0;
  for await (const entry of cids) {
    try {
      let cid = entry.split('\t')[0];
      if (lastCid === 0 || lastCid !== Number(cid)) {
        lastCid = Number(cid);

        let readStream = createReadStream(cidTosid);
        let sids = readline.createInterface({
          input: readStream,
          crlfDelay: Infinity,
        });
        let allSids = [];
        for await (const sid of sids) {
          let sidsArray = sid.split('\t');
          if (cid === sidsArray[0]) {
            allSids.push(sidsArray[1]);
          }
        }

        let allPatens = [];
        let readStreamPatents = createReadStream(cidTopatent);
        let patentsStream = readline.createInterface({
          input: readStreamPatents,
          crlfDelay: Infinity,
        });
        for await (const patent of patentsStream) {
          let patentsArray = patent.split('\t');
          if (cid === patentsArray[0]) {
            allPatens.push(patentsArray[1]);
          }
        }
        let allPmids = [];
        let readStreamPmid = createReadStream(cidTopmid);
        let pmidsStream = readline.createInterface({
          input: readStreamPmid,
          crlfDelay: Infinity,
        });
        for await (const pmid of pmidsStream) {
          let pmidArray = pmid.split('\t');
          if (cid === pmidArray[0]) {
            allPmids.push(pmidArray[1]);
          }
        }
        let result = {};
        result._id = cid;
        result.data = {};
        if (allSids.length > 0) {
          result.data.sids = allSids;
        }
        if (allPmids.length > 0) {
          result.data.pmids = allPmids;
        }
        if (allPatens.length > 0) {
          result.data.patents = allPatens;
        }
        yield result;
      } else {
        continue;
      }
    } catch (e) {
      continue;
    }
  }
}
