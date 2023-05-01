import { cpus } from 'os';
import { Worker } from 'worker_threads';

import debugLibrary from '../../../utils/Debug.js';

export async function main(links) {
  const debug = debugLibrary('improveActivesOrNaturals Main');

  try {
    const values = Object.values(links).sort(() => Math.random() - 0.5);
    const workers = [];
    const url = new URL('worker.js', import.meta.url);

    const numWorkers = cpus().length / 2;
    const chunkSize = Math.floor(values.length / numWorkers);

    const chunks = [];
    for (let i = 0; i < numWorkers; i++) {
      const start = i * chunkSize;
      const end = i === numWorkers - 1 ? values.length : (i + 1) * chunkSize;
      const chunk = values.slice(start, end);
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
              debug(message);
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
    debug(e);
  }
}
