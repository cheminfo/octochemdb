import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('NPAtlases');
/**
 * Validates that the NPAtlas download URL used by the sync pipeline is still
 * listed on the official NPAtlas downloads page.
 *
 * Fetches `https://www.npatlas.org/download`, extracts every `<a>` tag that
 * carries a `download` attribute, and checks that every URL in
 * `previousLinks` appears in the extracted set.  If any URL is missing, a
 * **fatal** warning is logged so a developer can update the source URLs.
 *
 * @param {string[]} previousLinks - The NPAtlas download URLs currently
 *   configured in `syncNpatlases`.
 * @param {OctoChemConnection} connection - Active database connection used
 *   exclusively for fatal error logging.
 * @returns {Promise<string[]>} All download links found on the NPAtlas page.
 *   Returns an empty array if the page cannot be fetched.
 */
export async function checkNpAtlasesLink(previousLinks, connection) {
  try {
    // Fetch the HTML page that lists all downloadable NPAtlas files
    const response = await fetch('https://www.npatlas.org/download');
    const text = await response.text();

    // Regex: capture href values from anchor tags that carry a download attribute
    const regexAllPaths =
      /<a\b(?=[^>]*\bdownload\b)[^>]*\bhref\s*=\s*["'](?<href>[^"']+)["'][^>]*>/gim;
    const matches = [...text.matchAll(regexAllPaths)];
    const allPaths = matches.map((match) => match.groups?.href ?? match[1]);
    const baseUrl = 'https://www.npatlas.org';

    // Reconstruct full URLs by prepending the base and stripping leading "./"
    const links = allPaths.map((path) => baseUrl + path.replace('./', ''));
    // Verify every previously-known URL is still present on the page
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
    const err = e instanceof Error ? e : new Error(String(e));
    await debug.fatal(err.message, {
      collection: 'npatlases',
      connection,
    });
    return [];
  }
}
