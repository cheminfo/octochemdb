/* eslint-disable no-console */
import { cpus } from 'os';
import { Worker } from 'worker_threads';

import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

import getCollectionsLinks from './getCollectionsLinks.mjs';

const connection = new OctoChemConnection();
let linksCol = await getCollectionsLinks(connection);

export async function main(links) {
  try {
    let total = Object.keys(links).length;

    let values = Object.values(links).sort(() => Math.random() - 0.5);

    const workers = [];
    const url = new URL('worker.mjs', import.meta.url);

    const numWorkers = cpus().length / 2;
    const chunkSize = Math.floor(values.length / numWorkers);
    console.log(`Starting ${numWorkers} workers`);
    console.log(`Chunk size: ${chunkSize}`);
    console.log(`Total: ${total}`);
    for (let i = 0; i < numWorkers; i++) {
      const start = i * chunkSize;
      const end = i === numWorkers - 1 ? values.length : (i + 1) * chunkSize;
      const chunk = values.slice(start, end);
      let worker = new Worker(url);
      worker.postMessage({ links: chunk, workerID: i });
      workers.push(worker);
    }

    const counts = new Uint32Array(numWorkers);
    let lastLogDate = Date.now();
    await Promise.all(
      workers.map(
        (worker) =>
          new Promise((resolve, reject) => {
            worker.on('message', (message) => {
              counts[message.workerID] = message.currentCount;
              if (
                Date.now() - lastLogDate >
                  Number(process.env.DEBUG_THROTTLING) &&
                message.status === 'running'
              ) {
                let current = counts.reduce(
                  (previous, current) => previous + current,
                  0,
                );
                lastLogDate = Date.now();
                console.log(`Fragmented: ${current} / ${total} Molecules`);
              }
              if (message.status === 'done') {
                resolve(message);
              }
            });
            worker.on('error', reject);
            worker.on('exit', (code) => {
              if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
              }
            });
          }),
      ),
    );
  } catch (e) {
    if (connection) {
      console.log(e.message);
    }
  }
}

await main(linksCol);
const temporaryCollection = await connection.getCollection(
  'inSilicoFragments_tmp',
);
// rename temporary collection
await temporaryCollection.rename('inSilicoFragments', {
  dropTarget: true,
});
// stop script once done
process.exit(0);
