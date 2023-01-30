import workerPool from 'workerpool';
// path to the worker file
const url = new URL('improveCompound.js', import.meta.url);
// create worker pool
const pool = workerPool.pool(url.pathname);
/**
 * @description Multithread import of compounds
 * @param {*} molecule molecule from pubchem file
 * @returns {Promise} result to be imported
 */
export default async function improveCompoundPool(molecule) {
  return pool.exec('improveCompound', [molecule]);
}
