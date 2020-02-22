'use strict';

module.exports = async function() {
  return aggregate();
};

async function aggregate() {
  await require('./MFs')();
  await require('./commonMFs')();
  await require('./CHNOSClF')();
}
