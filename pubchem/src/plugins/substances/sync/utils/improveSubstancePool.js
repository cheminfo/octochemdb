import workerPool from 'workerpool';

const url = new URL('improveSubstance.js', import.meta.url);
//const url = new URL('improveCompound.js', import.meta.url);

const pool = workerPool.pool(url.pathname);
/**
 * @description execute the improveSubstance.js script with n-1 cores workers
 * @param {*} molecule molecule
 * @returns {Promise} execution of the pool
 */
export default async function improveSubstancePool(molecule) {
  return pool.exec('improveSubstance', [molecule]);
}
