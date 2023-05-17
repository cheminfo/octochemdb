import { cpus } from 'os';
import { Worker } from 'worker_threads';

import { OctoChemConnection } from '../../utils/OctoChemConnection.js';

export async function main() {
  const connection = new OctoChemConnection();
  const colletion = await connection.getCollection('substances');
  const total = await colletion.countDocuments();
  const url = new URL('worker.js', import.meta.url);
  const numWorkers = cpus().length / 4;
  console.log(total);
  const chunkSize = Math.floor(total / numWorkers);
  let workers = [];
  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const end = i === numWorkers - 1 ? total : (i + 1) * chunkSize;
    const chunk = [start, end];
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
              Date.now() - lastLogDate > 60000 &&
              message.status === 'running'
            ) {
              let current = counts.reduce(
                (previous, current) => previous + current,
                0,
              );
              lastLogDate = Date.now();
              console.log(`Processing: ${current} / ${total} `);
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
}
await main();