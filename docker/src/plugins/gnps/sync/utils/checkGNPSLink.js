import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('GNPS');
/**
 * Checks if there are updates for the GNPS download links by comparing previous links with those found on the downloads page.
 *
 * @param {string[]} previousLinks - Array of previously known GNPS download links.
 * @param {import('../../../../utils/OctoChemConnection.js').OctoChemConnection} connection - The OctoChemConnection instance for logging.
 * @returns {Promise<string[]>} A promise that resolves to an array of all GNPS download links found on the downloads page.
 */
export async function checkGNPSLink(previousLinks, connection) {
  try {
    const response = await fetch('https://external.gnps2.org/gnpslibrary');
    const text = await response.text();
    //console.log(text);
    const regexAllPaths = /(?:https?:\/\/[^\s"'<>]+)?\/[^\s"'<>]+\.json(?!\.)/g;
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
    // @ts-ignore
    await debug.fatal(e.message, {
      collection: 'gnps',
      connection,
    });
    return [];
  }
}
