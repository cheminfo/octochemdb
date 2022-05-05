import { getWordsList } from 'most-common-words-by-language';
import Debug from '../../../utils/Debug.js';
const debug = Debug('keywords');
export async function getKeywords(activityInfo, taxons) {
  const toIgnores = getWordsList('english', 200);
  const ignoreSet = new Set();
  toIgnores.push('nci', 'ug/ml', 'ug', 'ml', 'nm', '%', ':', 'nM');
  for (let toIgnore of toIgnores) {
    ignoreSet.add(toIgnore);
  }

  const keywords = new Set();
  let strings = [];

  for (let entry of activityInfo) {
    if (entry?.assay) {
      strings.push(entry.assay);
    }
  }
  for (let entry of taxons) {
    if (entry?.genus) {
      strings.push(entry.genus);
    }
  }

  for (let string of strings) {
    let newKeywords = string
      .toLowerCase()
      .split(/\W+/)
      .filter((k) => k);
    for (let keyword of newKeywords) {
      if (!ignoreSet.has(keyword) && isNaN(Number(keyword))) {
        keywords.add(keyword);
      }
    }
  }

  return [...keywords].sort();
}
