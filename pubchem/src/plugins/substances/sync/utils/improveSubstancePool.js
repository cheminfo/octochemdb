import workerPool from 'workerpool';

const url = new URL('improveSubstance.js', import.meta.url);
//const url = new URL('improveCompound.js', import.meta.url);

const pool = workerPool.pool(url.pathname);

export default async function improveSubstancePool(molecule, connection) {
  return pool.exec('improveSubstance', [molecule, connection]);
}
