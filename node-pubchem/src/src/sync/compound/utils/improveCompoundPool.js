import WorkerNodes from 'worker-nodes';

const url = new URL('improveCompounds.js', import.meta.url);

const workerNodes = new WorkerNodes(url.pathname);

export default async function improve(molecule) {
  return workerNodes.call(molecule);
}
