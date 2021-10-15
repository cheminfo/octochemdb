'use strict';

const PubChemConnection = require('../../util/PubChemConnection');

const debug = require('debug')('aggregate');

const aggregateCHNOSClF = require('./aggregateCHNOSClF');
const aggregateCommonMFs = require('./aggregateCommonMFs');
const aggregateMFs = require('./aggregateMFs');

module.exports = async function aggregate() {
  let connection;
  try {
    connection = new PubChemConnection();
    await aggregateMFs(connection);
    await aggregateCommonMFs(connection);
    await aggregateCHNOSClF(connection);
  } catch (e) {
    console.log(e);
  } finally {
    debug('Closing connection');
    if (connection) await connection.close();
  }
};
