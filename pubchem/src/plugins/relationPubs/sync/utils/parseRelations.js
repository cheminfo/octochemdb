import { createReadStream } from 'fs';
import { parse } from 'papaparse';
import * as readline from 'readline';
export async function* parseRelations(cidTopmid, cidTosid, cidTopatent) {
  const readStream = createReadStream(cidTosid);
  let cids = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  for await (const entry of cids) {
    try {
      let cid = entry.split('\t')[0];
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
      result.cid = cid;
      if (allSids.length > 0) {
        result.sids = allSids;
      }
      if (allPmids.length > 0) {
        result.pmids = allPmids;
      }
      if (allPatens.length > 0) {
        result.patents = allPatens;
      }

      yield result;
    } catch (e) {
      continue;
    }
  }
}
