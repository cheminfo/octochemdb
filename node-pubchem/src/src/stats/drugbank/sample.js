'use strict';

const path = require('path');

const fs = require('fs-extra');
const mfUtil = require('mf');
const rules = require('rules');

const ppm = rules.samplePpm;
const penality = rules.ratioPenality;

const stats = require('../../../stats.json');

const ratioStats = stats.results;
const data = readJSON(path.join(__dirname, 'data/mfs.json'));

for (var i = 2; i < data.length; i++) {
  const folder = path.join(__dirname, `data/range${i}`);
  const thisData = data[i];
  const formulas = thisData.formulas;
  const results = new Array(formulas.length);
  var total = 0;
  for (var j = 0; j < formulas.length; j++) {
    const formula = readJSON(path.join(folder, `${formulas[j].mf}.json`));
    const candidatesList = formula.results;
    candidatesList.forEach((candidate) => {
      const mf = candidate.mf;
      const reg = mf.split(/(?=[A-Z])/);
      candidate.atom = {};
      reg.forEach((atom) => {
        const result = atom.split(/(?=[0-9])/);
        var number = result.slice(1).join('');
        candidate.atom[result[0]] = number ? number >> 0 : 1;
      });
      mfUtil.addRatio(candidate);
      addScore(candidate);
    });

    const em = formula.em;
    const mf = formula.mf;
    const result = {
      mf: mf,
      em: em,
      ppm: new Array(ppm.length)
    };
    results[j] = result;

    var end = candidatesList.length - 1;

    for (var k = ppm.length - 1; k >= 0; k--) {
      var ppmValue = ppm[k];
      while (Math.abs(candidatesList[end].ppm) >= ppmValue && end >= 0) {
        end--;
      }
      var candidates = candidatesList.slice(0, end + 1);
      candidates.sort((candA, candB) => candB.ratioScore - candA.ratioScore);
      var sortedIndex = candidates.findIndex((cand) => cand.mf === mf);

      result.ppm[k] = {
        ppm: ppmValue,
        numberResults: candidates.length,
        meanIndex: Math.floor(candidates.length / 2) + 1,
        ratioIndex: sortedIndex + 1,
        ratioScore: candidates[sortedIndex].ratioScore
      };
    }
    if (total % 100 === 0) console.log(total);
    total++;
  }

  fs.writeFileSync(`${folder}.json`, JSON.stringify(results));
  break;
}


function addScore(candidate) {
  var em = candidate.em;
  var ratioStat = ratioStats.find((stat) => em >= stat.minMass && em < stat.maxMass).stats;
  var score = 1;
  var totalRatios = 0;
  for (var j = 0; j < ratioStat.length; j++) {
    var stat = ratioStat[j];
    var kind = stat.kind;
    var ratio = candidate.ratios[kind];
    if (!Number.isNaN(ratio) && ratio !== -Infinity && ratio !== Infinity) {
      totalRatios++;
      var distance = Math.abs(ratio - stat.mean) / stat.standardDeviation;
      score *= Math.pow(penality, distance);
    }
  }
  candidate.ratioScore = Math.pow(score, 1 / totalRatios);
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
