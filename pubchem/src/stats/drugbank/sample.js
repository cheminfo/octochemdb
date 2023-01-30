import path from 'path';

import fs from 'fs-extra';
import mfUtil from 'mf';
import rules from 'rules';

import stats from '../../../stats.json.js';
import debugLibrary from '../../utils/Debug.js';

const debug = debugLibrary('sample');
const ppm = rules.samplePpm;
const penality = rules.ratioPenality;

const ratioStats = stats.results;
const data = readJSON(path.join(__dirname, 'data/mfs.json'));

for (let i = 2; i < data.length; i++) {
  const folder = path.join(__dirname, `data/range${i}`);
  const thisData = data[i];
  const formulas = thisData.formulas;
  const results = new Array(formulas.length);
  let total = 0;
  for (let j = 0; j < formulas.length; j++) {
    const formula = readJSON(path.join(folder, `${formulas[j].mf}.json`));
    const candidatesList = formula.results;
    candidatesList.forEach((candidate) => {
      const mf = candidate.mf;
      const reg = mf.split(/(?=[A-Z])/);
      candidate.atom = {};
      reg.forEach((atom) => {
        const result = atom.split(/(?=[0-9])/);
        let number = result.slice(1).join('');
        candidate.atom[result[0]] = number ? number >> 0 : 1;
      });
      mfUtil.addRatio(candidate);
      addScore(candidate);
    });

    const em = formula.em;
    const mf = formula.mf;
    const result = {
      mf,
      em,
      ppm: new Array(ppm.length),
    };
    results[j] = result;

    let end = candidatesList.length - 1;

    for (let k = ppm.length - 1; k >= 0; k--) {
      let ppmValue = ppm[k];
      while (Math.abs(candidatesList[end].ppm) >= ppmValue && end >= 0) {
        end--;
      }
      let candidates = candidatesList.slice(0, end + 1);
      candidates.sort((candA, candB) => candB.ratioScore - candA.ratioScore);
      let sortedIndex = candidates.findIndex((cand) => cand.mf === mf);

      result.ppm[k] = {
        ppm: ppmValue,
        numberResults: candidates.length,
        meanIndex: Math.floor(candidates.length / 2) + 1,
        ratioIndex: sortedIndex + 1,
        ratioScore: candidates[sortedIndex].ratioScore,
      };
    }
    if (total % 100 === 0) debug(total);
    total++;
  }

  fs.writeFileSync(`${folder}.json`, JSON.stringify(results));
  break;
}

function addScore(candidate) {
  let em = candidate.em;
  let ratioStat = ratioStats.find(
    (stat) => em >= stat.minMass && em < stat.maxMass,
  ).stats;
  let score = 1;
  let totalRatios = 0;
  for (let j = 0; j < ratioStat.length; j++) {
    let stat = ratioStat[j];
    let kind = stat.kind;
    let ratio = candidate.ratios[kind];
    if (!Number.isNaN(ratio) && ratio !== -Infinity && ratio !== Infinity) {
      totalRatios++;
      let distance = Math.abs(ratio - stat.mean) / stat.standardDeviation;
      score *= Math.pow(penality, distance);
    }
  }
  candidate.ratioScore = Math.pow(score, 1 / totalRatios);
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
