'use strict';

const mlStat = require('ml-stat/array');

const pubChemConnection = new (require('../util/PubChemConnection'))();

generateStats()
  .catch((e) => console.log(e))
  .then((result) => {
    console.log('Done');
    pubChemConnection.close();
  });

const mfFunctions = require('../util//mf');
const rules = require('../util/rules');

const { minMass, maxMass, stepMass, elementRatios } = rules;
const distributionLength =
  (rules.ratioMaxValue - rules.ratioMinValue) / rules.ratioSlotWidth;

async function generateStats() {
  const mfsCollection = await pubChemConnection.getMfsCollection();

  const cursor = mfsCollection.find();
  const formulas = [];
  while (await cursor.hasNext()) {
    const nextValue = await cursor.next();
    if (mfFunctions.isFormulaAllowed(nextValue, minMass, maxMass)) {
      formulas.push(nextValue);
    }
  }
  formulas.sort((a, b) => a.em - b.em);
  mfFunctions.addRatios(formulas);

  const info = {
    date: new Date(),
    totalFormulas: formulas.length,
  };
  let bins = [];
  let start = 0;
  let end = 0;
  let maxIndex = formulas.length - 1;
  for (let mass = minMass + stepMass; mass <= maxMass; mass += stepMass) {
    while (end <= maxIndex && formulas[end].em < mass) {
      end++;
    }
    let sliced = formulas.slice(start, end);
    let stats = getStats(sliced);
    bins.push({
      minMass: mass - stepMass,
      maxMass: mass,
      nFormulas: sliced.length,
      stats: stats,
    });
    start = end;
  }

  let result = {
    options: rules,
    results: bins,
  };

  // we will save the result in the collection 'stats'
  let id = `${result.options.stepMass}_${result.options.elementRatios
    .join('.')
    .replace(/\//g, '-')}`;
  const statsCollection = await pubChemConnection.getMfStatsCollection();
  let statsEntry = {
    _id: id,
    options: result.options,
    allStats: result.results,
    info: info,
  };
  await statsCollection.replaceOne({ _id: statsEntry._id }, statsEntry, {
    upsert: true,
  });
  console.log(`Statistics saved as ${id} in collection mfStats`);

  // console.log(JSON.stringify(result, null, 2));
}

function getStats(mfs) {
  let stats = [];
  for (let key of elementRatios) {
    let stat = {
      kind: key,
      zeros: 0,
      infinities: 0,
      valids: 0,
      distribution: new Array(distributionLength).fill(0),
    };
    stats.push(stat);

    let log2array = [];

    for (let i = 0; i < mfs.length; i++) {
      let ratio = mfs[i].ratios[key];
      if (ratio === -Infinity) {
        // Math.log2(0)
        stat.zeros++;
      } else if (Number.isNaN(ratio) || ratio === Infinity) {
        // Math.log2(NaN) || Math.log2(Infinity)
        stat.infinities++;
      } else {
        stat.valids++;
        log2array.push(ratio);
        if (ratio < rules.ratioMinValue) {
          stat.distribution[0] += rules.weighted ? mfs[i].count : 1;
          // the first slot
        }
        if (ratio > rules.ratioMaxValue) {
          stat.distribution[distributionLength - 1] += rules.weighted
            ? mfs[i].count
            : 1;
          // the last slot
        } else {
          let slot = Math.floor(
            (ratio - rules.ratioMinValue) / rules.ratioSlotWidth - 1,
          );
          // eg. min = -10, max = 10, width = 0.5. For ratioLN = -8, slot is 3.

          /* var slot = Math.floor((ratioLN+7)*5); */
          stat.distribution[slot] += rules.weighted ? mfs[i].count : 1;
        }
      }
    }

    stat.mean = mlStat.mean(log2array);
    stat.standardDeviation = mlStat.standardDeviation(log2array);
  }
  return stats;
}
