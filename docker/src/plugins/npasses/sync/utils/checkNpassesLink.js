import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('NPASSES');

/**
 * Validates that the NPASS download URLs used by the sync pipeline are still
 * listed on the official NPASS downloads HTML page.
 *
 * The function fetches the page at `https://bidd.group/NPASS/downloadnpass.html`,
 * extracts every `<a href="…" download>` link, and checks that every URL in
 * `previousLinks` appears in the extracted set.  If any URL is missing the
 * function logs a **fatal** warning via the debug library so that a developer
 * can update the hard-coded source URLs.
 *
 * @param {string[]} previousLinks - The NPASS download URLs currently
 *   configured in `getNpassesLastFiles`.
 * @param {OctoChemConnection} connection - Active database connection used
 *   exclusively for fatal error logging.
 * @returns {Promise<string[]>} All download links found on the NPASS page.
 *   Returns an empty array if the page cannot be fetched.
 */
export async function checkNpassesLink(previousLinks, connection) {
  try {
    // Fetch the HTML page that lists all downloadable NPASS files
    const response = await fetch('https://bidd.group/NPASS/downloadnpass.html');
    const text = await response.text();

    // Regex: capture href values from anchor tags that carry a download attribute
    const regexAllPaths = /<a\s+href="([^"]+)"[^>]*download[^>]*>/gi;
    const matches = [...text.matchAll(regexAllPaths)];
    const allPaths = matches.map((match) => match[1]);
    const baseUrl = 'https://bidd.group/NPASS/';

    // Reconstruct full URLs by prepending the base and stripping leading "./"
    const links = allPaths.map((path) => baseUrl + path.replace('./', ''));

    // Verify every previously-known URL is still present on the page
    const allIncluded = previousLinks.every((prevLink) =>
      links.includes(prevLink),
    );
    if (!allIncluded) {
      await debug.fatal('⚠️New links found, please update source⚠️', {
        collection: 'npasses',
        connection,
      });

      return links;
    }
    return links;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    await debug.fatal(err.message, {
      collection: 'npasses',
      connection,
    });
    return [];
  }
}
