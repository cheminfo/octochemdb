import Debug from 'debug';

import PubChemConnection from '../../util/PubChemConnection.js';

import aggregateCHNOSClF from './aggregateCHNOSClF.js';
import aggregateCommonMFs from './aggregateCommonMFs.js';
import aggregateMFs from './aggregateMFs.js';

const debug = Debug('aggregate');

export default async function aggregate() {
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
}
