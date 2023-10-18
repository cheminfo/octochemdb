import debugLibrary from '../../../../utils/Debug.js';
import { parseHtmlEntities } from '../../../patents/sync/utils/parseHtmlEntities.js';

export function getRecords(entry, reference) {
  const debug = debugLibrary('getRecords');
  try {
    let result = {};
    if (entry?.tocheading !== undefined) {
      result.title = parseHtmlEntities(entry.tocheading);
    }
    result.values = [];
    if (entry?.description !== undefined) {
      result.description = parseHtmlEntities(entry.description);
    }
    if (Array.isArray(entry.information)) {
      for (let info of entry.information) {
        let infoToAdd = {};
        if (info?.description !== undefined) {
          infoToAdd.description = parseHtmlEntities(info.description);
        }
        if (info?.reference !== undefined) {
          infoToAdd.supplementaryRef = [];
          if (!Array.isArray(info.reference)) {
            info.reference = [info.reference];
          }
          for (let ref of info.reference) {
            infoToAdd.supplementaryRef.push(parseHtmlEntities(ref));
          }
        }
        if (reference[info?.referencenumber] !== undefined) {
          infoToAdd.reference = reference[info.referencenumber];
        }
        infoToAdd.values = [];
        if (Array.isArray(info?.value)) {
          for (let value of info.value) {
            let valueToAdd = {};
            if (value?.stringwithmarkup?.string !== undefined) {
              valueToAdd.value = parseHtmlEntities(
                value.stringwithmarkup.string,
              );
            }
            infoToAdd.values.push(valueToAdd);
          }
        } else if (info?.value?.stringwithmarkup?.string !== undefined) {
          infoToAdd.values.push(
            parseHtmlEntities(info.value.stringwithmarkup.string),
          );
        }
        result.values.push(infoToAdd);
      }
    } else {
      let infoToAdd = {};
      if (entry?.information?.description !== undefined) {
        infoToAdd.description = parseHtmlEntities(
          entry.information.description,
        );
      }
      if (entry?.information?.reference !== undefined) {
        infoToAdd.supplementaryRef = [];
        if (!Array.isArray(entry.information.reference)) {
          entry.information.reference = [entry.information.reference];
        }
        for (let ref of entry.information.reference) {
          infoToAdd.supplementaryRef.push(parseHtmlEntities(ref));
        }
      }
      if (reference[entry?.information?.referencenumber] !== undefined) {
        infoToAdd.reference = reference[entry.information.referencenumber];
      }
      infoToAdd.values = [];
      if (Array.isArray(entry?.information?.value)) {
        for (let value of entry.information.value) {
          let valueToAdd = {};

          if (value?.stringwithmarkup?.string !== undefined) {
            valueToAdd.value = parseHtmlEntities(value.stringwithmarkup.string);
          }
          infoToAdd.values.push(valueToAdd);
        }
      } else if (
        entry?.information?.value?.stringwithmarkup?.string !== undefined
      ) {
        infoToAdd.values.push(
          parseHtmlEntities(entry.information.value.stringwithmarkup.string),
        );
      }
      result.values.push(infoToAdd);
    }
    return result;
  } catch (e) {
    debug.error(e);
  }
}
