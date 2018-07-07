'use strict';

const fs = require('fs-extra');
const CC = require('chemcalc');
const mkdirp = require('mkdirp').sync;

const path = require('path');

const rules = require('rules');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/mfs.json'), 'utf8'));

for (var i = 2; i < data.length; i++) {
  var dir = path.join(__dirname, `data/range${i}`);
  mkdirp(dir);
  var formulas = data[i].formulas;
  console.log(`total: ${formulas.length}`);
  var total = 0;
  for (var j = 0; j < formulas.length; j++) {
    var formula = formulas[j];
    var list = CC.mfFromMonoisotopicMass(formula.em, {
      mfRange: rules.sampleMfRange,
      massRange: 100 * formula.em / 1e6,
      useUnsaturation: true,
      integerUnsaturation: true,
      minUnsaturation: 0,
      maxUnsaturation: 999,
      maxNumberRows: 1e6
    });
    var result = {
      mf: formula.mf,
      em: formula.em,
      bruteForceIteration: list.bruteForceIteration,
      realIteration: list.realIteration,
      results: list.results.map((result) => {
        return {
          mf: result.mf,
          em: result.em,
          ppm: Math.abs(result.ppm)
        };
      })
    };
    fs.writeFileSync(path.join(dir, `${formula.mf}.json`), JSON.stringify(result));
    total++;
    if (total % 100 === 0) console.log(total);
  }
  break;
}
