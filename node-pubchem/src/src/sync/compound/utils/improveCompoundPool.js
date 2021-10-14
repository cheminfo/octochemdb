'use strict';

const WorkerNodes = require('worker-nodes');

const workerNodes = new WorkerNodes(`${__dirname}/improveCompound.js`);

module.exports = async function improve(molecule) {
  return workerNodes.call(molecule);
};
