import { syncAllUspFolders } from './syncAllUspFolders.js';

async function startDownload() {
  await syncAllUspFolders({});
}

await startDownload();
