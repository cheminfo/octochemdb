import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('GNPS');

/**
 * Verifies that every URL in `previousLinks` still appears on the GNPS
 * library downloads page. When one or more links are missing a fatal alert
 * is sent via `debug.fatal` to signal that the source URLs need to be
 * updated.
 *
 * @param {string[]} previousLinks - The expected download URLs to verify.
 * @param {OctoChemConnection} connection - Active database connection wrapper
 *   used to report errors and link-change alerts via `debug.fatal`.
 * @returns {Promise<string[]>} All download URLs currently found on the GNPS
 *   downloads page (regardless of whether `previousLinks` matched).
 */
export async function checkGNPSLink(previousLinks, connection) {
  try {
    const response = await fetch('https://external.gnps2.org/gnpslibrary');
    const text = await response.text();
    const regexAllPaths =
      /(?:https?:\/\/[^\s"'<>]+)?\/[^\s"'<>]+\.json(?!\.)/g;
    const matches = [...text.matchAll(regexAllPaths)];
    const allPaths = matches.map((match) => match[0]);
    const baseUrl = 'https://external.gnps2.org';

    const links = allPaths.map((path) => baseUrl + path.replace('./', ''));
    const allIncluded = previousLinks.every((prevLink) =>
      links.includes(prevLink),
    );
    if (!allIncluded) {
      await debug.fatal('⚠️New links found, please update source⚠️', {
        collection: 'gnps',
        connection,
      });
      return links;
    }

    return links;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    await debug.fatal(err.message, {
      collection: 'gnps',
      connection,
      stack: err.stack,
    });
    return [];
  }
}
