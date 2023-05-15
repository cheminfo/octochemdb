import CC from 'chemcalc';
import functions from 'mf';
import rules from 'rules';

import stats from '../../stats.json.js';
import debugLibrary from '../utils/Debug.js';

const debug = debugLibrary('getScore');
const elementRatios = rules.elementRatios;
const penality = rules.ratioPenality;

const ratioStats = stats.results;

const result = analyseMass(474.20531, 5);
debug.trace(JSON.stringify(result, null, 2));

function analyseMass(em, ppm) {
  const result = {
    em,
    ppm,
  };

  let allCandidates = CC.mfFromMonoisotopicMass(em, {
    mfRange: rules.sampleMfRange,
    massRange: 0.00237,
    useUnsaturation: true,
    integerUnsaturation: true,
    minUnsaturation: -5,
    maxNumberRows: 1e6,
  });

  let candidatesList = allCandidates.results;
  candidatesList.forEach((candidate) => {
    let mf = CC.analyseMF(candidate.mf);
    candidate.atom = functions.getAtoms(mf);
  });
  functions.addRatios(candidatesList);
  calculateScores(candidatesList);

  let candidates = candidatesList;
  let unsortedIndex = candidates.findIndex((cand) => cand.em === 474.204924471);
  candidates.sort((candA, candB) => candB.ratioScore - candA.ratioScore);
  let sortedIndex = candidates.findIndex((cand) => cand.em === 474.204924471);
  debug.trace(sortedIndex);

  result.score = {
    numberResults: candidates.length,
    originalIndex: unsortedIndex,
    ratioIndex: sortedIndex,
    ratioScore: candidates[sortedIndex].ratioScore,
    thisRatio: candidates[sortedIndex],
  };

  return result;
}

function calculateScores(candidates) {
  for (let i = 0; i < candidates.length; i++) {
    let candidate = candidates[i];
    let em = candidate.em;
    let ratioStat = ratioStats.find(
      (stat) => em >= stat.minMass && em < stat.maxMass,
    ).stats;
    let score = 1;
    let totalRatios = 0;
    for (let j = 0; j < ratioStat.length; j++) {
      let stat = ratioStat[j];
      let kind = stat.kind;
      if (!elementRatios.includes(kind)) continue;
      let ratio = candidate.ratios[kind];
      if (ratio && ratio !== 0 && ratio !== Infinity) {
        totalRatios++;
        let distance = Math.abs(ratio - stat.mean) / stat.standardDeviation;
        score *= Math.pow(penality, distance);
      }
    }
    candidate.ratioScore = Math.pow(score, 1 / totalRatios);
  }
}
