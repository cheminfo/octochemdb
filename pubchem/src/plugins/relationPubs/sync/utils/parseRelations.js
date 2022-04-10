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
      let cid = entry[0];
      let readStream = createReadStream(cidTosid);
      let sids = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity,
      });
      let allSids = [];
      for await (const sid of sids) {
        if (cid === sid[0]) {
          allSids.push(sid[1]);
        }
      }

      let allPatens = [];
      let readStreamPatents = createReadStream(cidTopatent);
      let patentsStream = readline.createInterface({
        input: readStreamPatents,
        crlfDelay: Infinity,
      });
      for await (const patent of patentsStream) {
        if (cid === patent[0]) {
          allPatens.push(patent[1]);
        }
      }
      let allPmids = [];
      let readStreamPmid = createReadStream(cidTopmid);
      let pmidsStream = readline.createInterface({
        input: readStreamPmid,
        crlfDelay: Infinity,
      });
      for await (const pmid of pmidsStream) {
        //  console.log(pmid);
        if (cid === pmid[0]) {
          allPmids.push(pmid[1]);
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
