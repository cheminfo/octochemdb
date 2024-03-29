import { cpus } from 'os';
import { Worker } from 'worker_threads';

import debugLibrary from '../../../utils/Debug.js';
import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';

const connection = new OctoChemConnection();
export async function main(links) {
  const debug = debugLibrary('improveActivesOrNaturals Main');

  try {
    const total = Object.keys(links).length;
    const values = Object.values(links).sort(() => Math.random() - 0.5);
    const workers = [];
    const url = new URL('worker.js', import.meta.url);

    const numWorkers = cpus().length / 2;
    const chunkSize = Math.floor(values.length / numWorkers);
    debug.trace(`Starting ${numWorkers} workers`);
    debug.trace(`Chunk size: ${chunkSize}`);
    debug.trace(`Total: ${total}`);
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
                debug.trace(`Processing: ${current} / ${total} `);
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
      await debug.fatal(e.message, {
        collection: 'activesOrNaturals',
        connection,
        stack: e.stack,
      });
    }
  }
}
