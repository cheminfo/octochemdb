import { parseHtmlEntities } from '../../../patents/sync/utils/parseHtmlEntities.js';

export function getRecords(entry, reference) {
  let result = {};
  result.title = parseHtmlEntities(entry.tocheading);
  result.values = [];
  if (entry.description !== undefined) {
    result.description = parseHtmlEntities(entry.description);
  }
  if (Array.isArray(entry.information)) {
    for (let info of entry.information) {
      let infoToAdd = {};
      if (info.description !== undefined) {
        if (typeof info.description !== 'string') {
          infoToAdd.description = parseHtmlEntities(
            JSON.stringify(info.description),
          );
        } else {
          infoToAdd.description = parseHtmlEntities(info.description);
        }
      }
      if (info.reference !== undefined) {
        if (typeof info.reference !== 'string') {
          infoToAdd.supplementaryRef = parseHtmlEntities(
            JSON.stringify(info.reference),
          );
        } else {
          infoToAdd.supplementaryRef = parseHtmlEntities(info.reference);
        }
      }
      if (reference[info.referencenumber] !== undefined) {
        infoToAdd.reference = reference[info.referencenumber];
      }
      infoToAdd.values = [];
      if (Array.isArray(info.value)) {
        for (let value of info.value) {
          let valueToAdd = {};
          if (value.stringwithmarkup.string !== undefined) {
            if (typeof value.stringwithmarkup.string !== 'string') {
              valueToAdd.value = parseHtmlEntities(
                JSON.stringify(value.stringwithmarkup.string),
              );
            } else {
              valueToAdd.value = parseHtmlEntities(
                value.stringwithmarkup.string,
              );
            }
          }
          infoToAdd.values.push(valueToAdd);
        }
      } else if (info.value.stringwithmarkup.string !== undefined) {
        if (typeof info.value.stringwithmarkup.string !== 'string') {
          infoToAdd.values.push(
            parseHtmlEntities(
              JSON.stringify(info.value.stringwithmarkup.string),
            ),
          );
        } else {
          infoToAdd.values.push(
            parseHtmlEntities(info.value.stringwithmarkup.string),
          );
        }
      }
      result.values.push(infoToAdd);
    }
  } else {
    let infoToAdd = {};
    if (entry.information.description !== undefined) {
      infoToAdd.description = parseHtmlEntities(entry.information.description);
    }
    if (entry.information.reference !== undefined) {
      infoToAdd.supplementaryRef = parseHtmlEntities(
        JSON.stringify(entry.information.reference),
      );
    }
    if (reference[entry.information.referencenumber] !== undefined) {
      infoToAdd.reference = reference[entry.information.referencenumber];
    }
    infoToAdd.values = [];
    if (Array.isArray(entry.information.value)) {
      for (let value of entry.information.value) {
        let valueToAdd = {};
        if (value.stringwithmarkup.string !== undefined) {
          valueToAdd.value = parseHtmlEntities(value.stringwithmarkup.string);
        }
        infoToAdd.values.push(valueToAdd);
      }
    } else if (entry.information.value.stringwithmarkup.string !== undefined) {
      infoToAdd.values.push(
        parseHtmlEntities(entry.information.value.stringwithmarkup.string),
      );
    }
    result.values.push(infoToAdd);
  }
  return result;
}
