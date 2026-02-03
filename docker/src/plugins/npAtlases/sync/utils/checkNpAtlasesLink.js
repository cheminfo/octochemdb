import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('NPAtlases');
/**
 * Checks if there are updates for the NPAtlas download links by comparing previous links with those found on the downloads page.
 *
 * @param {string[]} previousLinks - Array of previously known NPAtlas download links.
 * @param {import('../../../../utils/OctoChemConnection').OctoChemConnection} connection - The OctoChemConnection instance for logging.
 * @returns {Promise<string[]>} A promise that resolves to an array of all NPAtlas download links found on the downloads page.
 */
export async function checkNpAtlasesLink(previousLinks, connection) {
  try {
    const response = await fetch('https://www.npatlas.org/download');
    const text = await response.text();

    const regexAllPaths =
      /<a\b(?=[^>]*\bdownload\b)[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gim;
    const matches = [...text.matchAll(regexAllPaths)];
    const allPaths = matches.map((match) => match[1]);
    const baseUrl = 'https://www.npatlas.org';

    const links = allPaths.map((path) => baseUrl + path.replace('./', ''));
    const allIncluded = previousLinks.every((prevLink) =>
      links.includes(prevLink),
    );
    if (!allIncluded) {
      await debug.fatal('⚠️New links found, please update source⚠️', {
        collection: 'npatlases',
        connection,
      });

      return links;
    }
    return links;
  } catch (e) {
    // @ts-ignore
    await debug.fatal(e.message, {
      collection: 'npatlases',
      connection,
    });
    return [];
  }
}
