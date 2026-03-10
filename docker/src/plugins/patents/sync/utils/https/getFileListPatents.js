import delay from 'delay';

import debugLibrary from '../../../../../utils/Debug.js';

/**
 * Fetches the PubChem patent RDF directory listing and returns two lists of
 * file descriptors: one for abstract dumps and one for title dumps.
 *
 * The function retries the HTTP request indefinitely (with a 10 s delay
 * between attempts) until it receives a 200 response or the request counter
 * exceeds 10, at which point warnings are emitted for each failure.
 *
 * Only files whose names start with `pc_patent2title_` or
 * `pc_patent2abstract_` are included. The caller can further filter entries
 * via `options.fileFilter`.
 *
 * @async
 * @param {string} url - Base URL of the PubChem patent RDF directory,
 *   e.g. `https://ftp.ncbi.nlm.nih.gov/pubchem/RDF/patent/`.
 * @param {GetFileListPatentsOptions} [options={}] - Optional filter settings.
 * @returns {Promise<{ abstracts2Download: PatentFileInfo[], titles2Download: PatentFileInfo[] } | undefined>}
 */
async function getFileListPatents(url, options = {}) {
  const debug = debugLibrary('getFileListPatents');
  try {
    let response;
    let text;
    let counter = 0;

    // Retry loop: keep requesting the directory listing until a 200 is
    // received. An AbortController enforces a 30-minute per-attempt timeout.
    while (true) {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1800 * 1000);
        response = await fetch(`${url}`, { signal: controller.signal });
        text = await response.text();
        if (response?.status === 200) {
          break;
        }
      } catch (e) {
        if (counter++ > 10) {
          const error = e instanceof Error ? e : new Error(String(e));
          debug.warn(error.message);
        }
        await delay(10000);
      }
    }

    const { fileFilter = () => true } = options;

    // Parse each HTML line for anchor tags and build PatentFileInfo objects.
    // Lines that don't match the anchor pattern or fail the fileFilter are
    // discarded.
    let files = text
      .split(/\r?\n/)
      .map((line) => {
        let match = line.match(/.*href="(?<href>.*)">(?<name>.*)<\/a>/);
        if (!match || !match.groups) return undefined;
        // Destructure into a plain object (groups is non-prototype).
        /** @type {PatentFileInfo} */
        let groups = { href: match.groups.href, name: match.groups.name };
        // Only attach a URL for the file types we care about.
        if (
          match.groups.name.startsWith('pc_patent2title_') ||
          match.groups.name.startsWith('pc_patent2abstract_')
        ) {
          groups.url = `${url}${match.groups.name}`;
        }
        return groups;
      })
      .filter((file) => fileFilter(file));

    // Deep-clone to strip any non-serialisable prototype references.
    files = JSON.parse(JSON.stringify(files));

    /** @type {PatentFileInfo[]} */
    let abstracts2Download = [];
    /** @type {PatentFileInfo[]} */
    let titles2Download = [];
    for (let file of files) {
      if (file?.url) {
        if (file.name.startsWith('pc_patent2abstract_')) {
          abstracts2Download.push(file);
        }
        if (file.name.startsWith('pc_patent2title_')) {
          titles2Download.push(file);
        }
      } else {
        continue;
      }
    }
    return { abstracts2Download, titles2Download };
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    debugLibrary('getFileListPatents').fatal(error.message, { stack: error.stack });
  }
}

export default getFileListPatents;
