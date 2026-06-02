import { cpus } from 'node:os';

import delay from 'delay';
import Piscina from 'piscina';

import DebugLibrary from '../../../../utils/Debug.js';
// eslint-disable-next-line new-cap
const debug = DebugLibrary('improveCompoundPool');
const url = new URL('improveCompound.js', import.meta.url);
let nbCPU = cpus().length;
const cpuLimit = Number.parseInt(process.env.IMPORT_CPUS, 10);
if (Number.isFinite(cpuLimit) && cpuLimit > 0) {
  nbCPU = Math.min(nbCPU, cpuLimit);
}
if (process.env.NODE_ENV === 'test') {
  nbCPU = 1;
}
const piscina = new Piscina({
  filename: url.pathname,
  minThreads: nbCPU,
  maxThreads: nbCPU,
  idleTimeout: 1000,
});

// Number of compounds that have left the Piscina queue but whose downstream
// resolution (mongo upsert, progress update) hasn't completed yet. Backpressure
// must cover this stage too — bounding only piscina.queueSize lets the
// producer outrun mongo and grow the heap until OOM.
let pendingResolutions = 0;

/**
 * @description Multithread import of compounds
 * @param molecule
 * @param [options={}]
 * @returns result to be imported, plus a `settled` hook the producer
 *   resolves when its own downstream work (upsert, progress write) is done
 *   so the pool can release the backpressure slot for this compound.
 */
export default async function improveCompoundPool(molecule, options = {}) {
  const timeForTimeout = options.timeout || 60000;
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeForTimeout);
  while (piscina.queueSize + pendingResolutions > nbCPU * 5) {
    await delay(1);
  }

  pendingResolutions++;
  let releaseSlot;
  const settled = new Promise((resolve) => {
    releaseSlot = () => {
      pendingResolutions--;
      resolve();
    };
  });

  const promise = piscina
    .run(molecule, { signal: abortController.signal })
    .then((info) => {
      clearTimeout(timeout);
      return info;
    })
    .catch((error) => {
      debug.info(error);
    });
  return {
    promise,
    settled,
    done: releaseSlot,
  };
}
