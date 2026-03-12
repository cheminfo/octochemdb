import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('CMAUP');
/**
 * Verifies that every URL in `previousLinks` still appears on the CMAUP
 * downloads page. When one or more links are missing a fatal alert is sent
 * via `debug.fatal` to signal that the source URLs need to be updated.
 *
 * @param {string[]} previousLinks - The expected download URLs to verify.
 * @param {OctoChemConnection} connection - Active database connection wrapper
 *   used to report errors and link-change alerts via `debug.fatal`.
 * @returns {Promise<string[]>} All download URLs currently found on the CMAUP
 *   downloads page (regardless of whether `previousLinks` matched).
 */
export async function checkCmaupLink(previousLinks, connection) {
  try {
    const response = await fetch('https://www.bidd.group/CMAUP/download.html');
    const text = await response.text();

    // Extract all href values from <a> tags with download attribute
    const regexAllPaths = /<a\s+href="(?<href>[^"]+)"[^>]*download[^>]*>/gi;
    const matches = [...text.matchAll(regexAllPaths)];
    const allPaths = matches.map((match) => match.groups?.href ?? '');
    const baseUrl = 'https://bidd.group/CMAUP/';

    const links = allPaths.map((path) => baseUrl + path.replace('./', ''));

    const allIncluded = previousLinks.every((prevLink) =>
      links.includes(prevLink),
    );
    if (!allIncluded) {
      await debug.fatal('⚠️New links found, please update source⚠️', {
        collection: 'cmaups',
        connection,
      });

      return links;
    }
    return links;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    await debug.fatal(err.message, {
      collection: 'cmaups',
      connection,
      stack: err.stack,
    });
    return [];
  }
}
