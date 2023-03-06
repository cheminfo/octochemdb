/* eslint-disable */
import CC from 'chemcalc';
import co from 'co';
import functions from 'mf';
import mongo from 'mongo';
import rules from 'rules';

import stats from '../../stats.json.js';
import debugLibrary from '../utils/Debug.js';

const debug = debugLibrary('sample');
process.on('unhandledRejection', (e) => {
  throw e;
});

const ppm = rules.samplePpm;
const penality = rules.ratioPenality;

const ratioStats = stats.results.filter((stat) => {
  return stat.minMass >= rules.sampleMin && stat.maxMass <= rules.sampleMax;
});

let db;
co(function* formulaMongo() {
  db = yield mongo.connect();
  debug('connected to MongoDB');

  const aggregateMf = db.collection('aggregateMf');
  const formulaSet = new Set();
  while (formulaSet.size < rules.randomSamples) {
    const sampling = yield aggregateMf
      .aggregate([{ $sample: { size: 1000 } }])
      .toArray();
    for (
      let i = 0;
      i < sampling.length && formulaSet.size < rules.randomSamples;
      i++
    ) {
      let sample = sampling[i];
      if (
        functions.isFormulaAllowed(sample, rules.sampleMin, rules.sampleMax) &&
        !formulaSet.has(sample._id)
      ) {
        formulaSet.add(sample._id);
      }
    }
  }
  const formulas = Array.from(formulaSet);
  const result = new Array(formulas.length);
  for (let j = 0; j < formulas.length; j++) {
    try {
      result[j] = analyseFormula(formulas[j], j);
    } catch (e) {
      debug('error!');
      result[j] = null;
    }
  }
  debug(JSON.stringify(result, null, 2));
})
  .catch((e) => {
    debug('error');
    debug(e.stack);
  })
  .then(() => {
    debug('closing DB');
    if (db) db.close();
  });

function analyseFormula(mf, index) {
  debug(`${mf} (${index})`);
  const result = {
    mf,
    em: 0,
    ppm: new Array(ppm.length),
  };
  const info = CC.analyseMF(mf, {
    isotopomers: 'arrayXXYY',
    fwhm: 0.3,
  });
  info.arrayXXYY[0] = info.arrayXXYY[0].map((value) => Math.round(value));
  const em = (result.em = info.em);

  let allCandidates = CC.mfFromMonoisotopicMass(em, {
    mfRange: rules.sampleMfRange,
    massRange: (em * ppm[ppm.length - 1]) / 1e6,
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

  let end = candidatesList.length - 1;
  for (let i = ppm.length - 1; i >= 0; i--) {
    let ppmValue = ppm[i];
    while (Math.abs(candidatesList[end].ppm) >= ppmValue && end >= 0) {
      end--;
    }
    let candidates = candidatesList.slice(0, end + 1);
    candidates.sort((candA, candB) => candB.ratioScore - candA.ratioScore);
    let sortedIndex = candidates.findIndex((cand) => cand.em === em);

    result.ppm[i] = {
      ppm: ppmValue,
      numberResults: candidates.length,
      meanIndex: Math.ceil(candidates.length / 2),
      ratioIndex: sortedIndex,
      ratioScore: candidates[sortedIndex].ratioScore,
      thisRatio: candidates[sortedIndex],
    };
  }

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
      let ratio = candidate.ratios[kind];
      if (!Number.isNaN(ratio) && ratio !== -Infinity && ratio !== Infinity) {
        totalRatios++;
        let distance = Math.abs(ratio - stat.mean) / stat.standardDeviation;
        score *= Math.pow(penality, distance);
      }
    }
    candidate.ratioScore = Math.pow(score, 1 / totalRatios);
  }
}
