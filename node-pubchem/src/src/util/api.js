'use strict';

const mongo = require('mongo');
const co = require('co');

const dataCollection = mongo.connect().then((db) => db.collection('data'));
const mfStatsCollection = mongo.connect().then((db) => db.collection('mfStats'));

/*
Search statistics about a kind of molecular formula
You may specify the stepMass and elementRatios
 */
const mfStatsSearch = co.wrap(function* mfStatsSearch(query = {}) {
  var {
    stepMass = 25,
    elementRatios = 'C-H.C-N.C-O.C-S.C-P.C-FClBr.O-P.O-S.CCNP-HFClBr',
    id
  } = query;

  if (!id) id = `${stepMass}_${elementRatios}`;

  const stats = yield mfStatsCollection;
  return yield stats.findOne({ _id: id });
});


const mfStatsToc = co.wrap(function* mfStatsSearch(query = {}) {
  const stats = yield mfStatsCollection;
  return yield stats.find().project({ _id: 1, options: 1, info: 1 }).limit(10000).toArray();
});


exports.mfStats = {
  search: mfStatsSearch,
  toc: mfStatsToc
};
