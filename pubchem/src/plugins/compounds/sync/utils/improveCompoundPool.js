import workerPool from 'workerpool';

const url = new URL('improveCompound.js', import.meta.url);
//const url = new URL('improveCompound.js', import.meta.url);

const pool = workerPool.pool(url.pathname);

export default async function improveCompoundPool(molecule, connection) {
  return pool.exec('improveCompound', [molecule, connection]);
}
