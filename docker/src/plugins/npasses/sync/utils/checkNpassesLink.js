import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('NPASSES');
/**
 * @description Check if there is an update for the coconut link by comparing the previous link with the links found on the downloads page
 * @param {*} previousLink - The previous coconut link
 * @param {*} connection - The OctoChemConnection instance
 * @returns {Promise<string[]>} returns a promise that resolves to an array of all coconut links found on the downloads page
 */
export async function checkNpassesLink(previousLinks, connection) {
  try {
    const response = await fetch('https://bidd.group/NPASS/downloadnpass.html');
    const text = await response.text();

    // Extract all href values from <a> tags with download attribute
    const regexAllPaths = /<a\s+href="([^"]+)"[^>]*download[^>]*>/gi;
    const matches = [...text.matchAll(regexAllPaths)];
    const allPaths = matches.map((match) => match[1]);
    const baseUrl = 'https://bidd.group/NPASS/';

    const links = allPaths.map((path) => baseUrl + path.replace('./', ''));

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
    // @ts-ignore
    await debug.fatal(e.message, {
      collection: 'npasses',
      connection,
    });
    return [];
  }
}
