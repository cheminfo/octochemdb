/* eslint-disable */
import co from 'co';
import fs from 'fs-extra';
import mongo from 'mongo';

import debugLibrary from '../utils/Debug.js';

process.on('unhandledRejection', (e) => {
  throw e;
});
const debug = debugLibrary('addStatsCHNOSCIF');
let limit = 1e10;
let rules = {
  minMass: 50,
  maxMass: 1000,
  minCount: 3,
  collection: 'statsCHNOSClF',
};

let db;
co(function* () {
  db = yield mongo.connect();
  debug.trace('connected to MongoDB');

  const aggregateCHNOSClF = db.collection('aggregateCHNOSClF');
  const cursor = aggregateCHNOSClF
    .find({}, { _id: 1, count: 1, em: 1 })
    .limit(limit);
  let formulas = [];
  while (yield cursor.hasNext()) {
    const nextValue = yield cursor.next();
    if (mfAllowed(nextValue)) {
      formulas.push(nextValue);
    }
  }
  formulas.sort((a, b) => a.em - b.em);

  formulas = formulas.map((a) => {
    return { mf: a._id, count: a.count, em: a.em };
  });

  const info = {
    date: new Date(),
    totalFormulas: formulas.length,
  };

  // we will save the result in the collection 'stats'
  let id = `${rules.minMass}_${rules.maxMass}_${rules.minCount}`;
  const statsCollection = db.collection(rules.collection);
  let statsEntry = {
    _id: id,
    options: rules,
    formulas,
    info,
  };

  fs.writeFileSync(`/tmp/${rules.collection}`, JSON.stringify(statsEntry));

  yield statsCollection.replaceOne({ _id: statsEntry._id }, statsEntry, {
    upsert: true,
  });
  debug.trace(`Statistics saved as ${id} in collection ${rules.collection}`);

  // debug(JSON.stringify(result, null, 2));
})
  .catch((e) => {
    debug.error(e.stack);
  })
  .then(() => {
    debug.trace('closing DB');
    if (db) db.close();
  });

function mfAllowed(formula) {
  if (
    formula.em > rules.maxMass ||
    formula.em < rules.minMass ||
    formula.count < rules.minCount
  ) {
    return false;
  }
  return true;
}
