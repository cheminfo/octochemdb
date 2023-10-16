import { open } from 'fs/promises';

import { parseStream } from 'arraybuffer-xml-parser';

import debugLibrary from '../../../../utils/Debug.js';

export default async function* parseLccs(filePath) {
  const debug = debugLibrary('parseLccs');
  const fileStream = await open(filePath, 'r');
  const readableStream = fileStream.readableWebStream();
  //Reference
  // parse the pubmed file stream
  for await (const entry of parseStream(readableStream, 'Record')) {
    let result = {};
    recursiveLowerCase(entry);
    if (entry.recordType === 'CID') {
      result = {
        _id: entry.recordnumber,
        data: {},
      };
    }

    //console.log(entry.section);
    for (let info of entry.section) {
      if (info.tocheading === 'GHS Classification') {
        //console.log(info.information[1].value);
        result.data = {
          description: info.description,
        };
        let signals = {};
        let ghsStatements = [];
        let hCodes = [];
        let pCodes = [];
        for (let classification of info.information) {
          if (classification.name === 'Pictogram(s)') {
            let pictograms = [];
            const markup = classification.value.stringwithmarkup.markup;
            if (Array.isArray(markup)) {
              for (let pictogram of markup) {
                pictograms.push({
                  type: pictogram.extra,
                  svgUrl: pictogram.url,
                });
              }
            } else {
              pictograms.push({
                type: markup.extra,
                svgUrl: markup.url,
              });
            }
            result.data.pictograms = pictograms;
          }
          if (classification.name === 'Precautionary Statement Codes') {
            // console.log(classification.value);
            const statements = classification.value.stringwithmarkup;
            for (let precautionaryStatement of statements) {
              //  console.log(precautionaryStatement);
              if (precautionaryStatement.markup !== undefined) {
                continue;
              }

              let codes = precautionaryStatement.string.split(
                /\s*,\s*(?:and)?\s*|\s*\+\s*/,
              );
              pCodes = pCodes.concat(codes);
            }
          }
          if (classification.name === 'Signal') {
            const currentSignal = classification.value.stringwithmarkup.string;
            signals[currentSignal] = true;
          }

          if (classification.name === 'GHS Hazard Statements') {
            const stringMarkup = classification.value.stringwithmarkup;
            if (Array.isArray(stringMarkup)) {
              for (let markup of stringMarkup) {
                ghsStatements.push(markup.string);
              }
            } else {
              ghsStatements.push(stringMarkup.string);
              console.log(stringMarkup.string.split(/\s*,\s*(?=H\d+:)/));
            }
            // need regex to split when there is HXXX: like:H227:
            // split('H\d{3}:')
          }
          //   console.log(classification.name);
        }
        result.ghsStatements = ghsStatements;
        result.data.signals = Object.keys(signals);
      }
    }
    const count = 1;
    if (count > 0) {
      continue;
    }
    yield entry;
  }
}

function recursiveLowerCase(obj) {
  if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      const lowerKey = key.toLowerCase();
      if (key !== lowerKey) {
        obj[lowerKey] = obj[key];
        delete obj[key];
      }
      recursiveLowerCase(obj[lowerKey]);
    }
  }
}
