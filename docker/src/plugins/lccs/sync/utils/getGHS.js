import pkg from 'fs-extra';

const { readFileSync } = pkg;
export function getGHS(path) {
  const file = readFileSync(path, 'utf8');
  let hCodes = {};
  let pCodes = {};
  for (let line of file.split('\n').slice(1)) {
    if (line.startsWith('H')) {
      const [
        hCode,
        hStatement,
        ghsClass,
        ghsCategory,
        unModel,
        ghsPictograms,
        ghsSignal,
        pCode,
      ] = line.split('\t');

      hCodes[hCode] = {};
      if (hStatement !== '') {
        hCodes[hCode].hStatement = hStatement;
      }
      if (ghsClass !== '') {
        hCodes[hCode].ghsClass = ghsClass;
      }
      if (ghsCategory !== '') {
        hCodes[hCode].ghsCategory = ghsCategory;
      }
      if (unModel !== '') {
        hCodes[hCode].unModel = unModel;
      }
      if (ghsPictograms !== '') {
        hCodes[hCode].ghsPictograms = ghsPictograms;
      }
      if (ghsSignal !== '') {
        hCodes[hCode].ghsSignal = ghsSignal;
      }
      if (pCode !== '') {
        hCodes[hCode].pCode = pCode.replace(/\s+/g, '');
      }
      continue;
    }
    if (line.startsWith('P')) {
      let [pCode, pStatement] = line.split('\t');
      pCodes[pCode] = {};
      if (pStatement !== '') {
        pCodes[pCode] = pStatement;
      }
    }
  }

  return { hCodes, pCodes };
}
