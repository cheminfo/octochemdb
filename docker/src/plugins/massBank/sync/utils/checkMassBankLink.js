import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('MASSBANK');
/**
 * @description Check if there is an update for the coconut link by comparing the previous link with the links found on the downloads page
 * @param {*} previousLink - The previous coconut link
 * @param {*} connection - The OctoChemConnection instance
 * @returns {Promise<string[]>} returns a promise that resolves to an array of all coconut links found on the downloads page
 */
export async function checkMassBankLink(previousLink, connection) {
  try {
    const response = await fetch(
      'https://github.com/MassBank/MassBank-data/releases/latest',
    );
    const text = await response.text();

    // extract all links in the response text section Downloads
    const regexDownloadsSection =
      /<include-fragment\b[^>]*\bsrc="([^"]*\/releases\/expanded_assets\/[^"]+)"[^>]*>/;

    const downloadsSectionMatch = text.match(regexDownloadsSection);
    const expanded_assets_url = await fetch(downloadsSectionMatch?.[1]);
    const expanded_assets_text = await expanded_assets_url.text();
    let allLinks = expanded_assets_text.match(
      /href="([^"]*\/(?:releases\/download|archive\/refs\/tags)\/[^"]+)"/g,
    );
    allLinks = allLinks.map(
      (link) =>
        `https://github.com${link.replace('href="', '').replace('"', '')}`,
    );
    if (!allLinks.includes(previousLink)) {
      await debug.fatal('⚠️New links found, please update source⚠️', {
        collection: 'massBank',
        connection,
      });
      return allLinks;
    }
    return allLinks;
  } catch (e) {
    // @ts-ignore
    await debug.fatal(e.message, {
      collection: 'massBank',
      connection,
    });
    return [];
  }
}
