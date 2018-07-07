'use strict';


const CC = require('chemcalc');
const functions = require('mf');
const rules = require('rules');

const elementRatios = rules.elementRatios;
const penality = rules.ratioPenality;
const stats = require('../../stats.json');

const ratioStats = stats.results;

const result = analyseMass(474.20531, 5);
console.log(JSON.stringify(result, null, 2));

function analyseMass(em, ppm) {
  const result = {
    em: em,
    ppm: ppm
  };

  var allCandidates = CC.mfFromMonoisotopicMass(em, {
    mfRange: rules.sampleMfRange,
    massRange: 0.00237,
    useUnsaturation: true,
    integerUnsaturation: true,
    minUnsaturation: -5,
    maxNumberRows: 1e6
  });

  var candidatesList = allCandidates.results;
  candidatesList.forEach((candidate) => {
    var mf = CC.analyseMF(candidate.mf);
    candidate.atom = functions.getAtoms(mf);
  });
  functions.addRatios(candidatesList);
  calculateScores(candidatesList);

  var candidates = candidatesList;
  var unsortedIndex = candidates.findIndex((cand) => cand.em === 474.204924471);
  candidates.sort((candA, candB) => candB.ratioScore - candA.ratioScore);
  var sortedIndex = candidates.findIndex((cand) => cand.em === 474.204924471);
  console.log(sortedIndex);

  result.score = {
    numberResults: candidates.length,
    originalIndex: unsortedIndex,
    ratioIndex: sortedIndex,
    ratioScore: candidates[sortedIndex].ratioScore,
    thisRatio: candidates[sortedIndex]
  };

  return result;
}

function calculateScores(candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];
    var em = candidate.em;
    var ratioStat = ratioStats.find((stat) => em >= stat.minMass && em < stat.maxMass).stats;
    var score = 1;
    var totalRatios = 0;
    for (var j = 0; j < ratioStat.length; j++) {
      var stat = ratioStat[j];
      var kind = stat.kind;
      if (!elementRatios.includes(kind)) continue;
      var ratio = candidate.ratios[kind];
      if (ratio && ratio !== 0 && ratio !== Infinity) {
        totalRatios++;
        var distance = Math.abs(ratio - stat.mean) / stat.standardDeviation;
        score *= Math.pow(penality, distance);
      }
    }
    candidate.ratioScore = Math.pow(score, 1 / totalRatios);
  }
}
