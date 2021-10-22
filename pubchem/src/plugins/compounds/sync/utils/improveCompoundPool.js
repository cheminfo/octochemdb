import workerPool from 'workerpool';

const url = new URL('improveCompound.js', import.meta.url);
//const url = new URL('test.js', import.meta.url);

const pool = new workerPool.pool(url.pathname);

export default async function improveCompoundPool(molecule) {
  return pool.exec('improveCompound', [molecule]);
}
