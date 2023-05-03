import { cpus } from 'os';
import { Worker } from 'worker_threads';

import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

export async function main() {
  try {
    const connection = new OctoChemConnection();
    const collection = await connection.getCollection('compounds');
    let links = await collection
      .aggregate([
        {
          $project: {
            _id: 1,
          },
        },
      ])
      .toArray();
    console.log(links.length);

    const workers = [];
    const url = new URL('worker.mjs', import.meta.url);

    const numWorkers = cpus().length / 2;
    const chunkSize = Math.floor(links.length / numWorkers);

    const chunks = [];
    for (let i = 0; i < numWorkers; i++) {
      const start = i * chunkSize;
      const end = i === numWorkers - 1 ? links.length : (i + 1) * chunkSize;
      const chunk = links.slice(start, end);
      chunks.push(chunk);
    }
    for (let i = 0; i < numWorkers; i++) {
      let worker = new Worker(url);
      let links = chunks[i];
      let workerID = `worker ${i + 1}`;
      worker.postMessage({ links, workerID });
      workers.push(worker);
    }

    await Promise.all(
      workers.map(
        (worker) =>
          new Promise((resolve, reject) => {
            worker.on('message', (message) => {
              console.log(message);
              resolve(message);
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
    console.log(e);
  }
}
await main();
