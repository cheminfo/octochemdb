import workerPool from 'workerpool';

const url = new URL('improvePubmed.js', import.meta.url);

const pool = workerPool.pool(url.pathname);

export default async function improvePubmedPool(entry) {
  return pool.exec('improvePubmed', [entry]);
}
