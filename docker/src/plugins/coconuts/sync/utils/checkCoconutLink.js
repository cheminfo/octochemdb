import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('COCONUT');
/**
 * @description Check if there is an update for the coconut link by comparing the previous link with the links found on the downloads page
 * @param {*} previousLink - The previous coconut link
 * @param {*} connection - The OctoChemConnection instance
 * @returns {Promise<string[]>} returns a promise that resolves to an array of all coconut links found on the downloads page
 */
export async function checkCoconutLink(previousLink, connection) {
  try {
    const response = await fetch(
      'https://coconut.naturalproducts.net/download',
    );
    const text = await response.text();
    // extract all links in the response text section Downloads
    const regexDownloadsSection =
      /<article\b[^>]*class="[^"]*\bpy-12\b[^"]*\bmt-24\b[^"]*"[^>]*>[\s\S]*?<\/article>/;
    const downloadsSectionMatch = text.match(regexDownloadsSection);
    const downloadsSection = downloadsSectionMatch
      ? downloadsSectionMatch[0]
      : null;
    // now from the donwloadsSection extract the coconut links (all of them)
    const regexAllLinks = /https?:\/\/[^\s"'<>]+/;
    const allLinks = downloadsSection
      ? downloadsSection.match(new RegExp(regexAllLinks, 'g')) || []
      : [];
    if (!allLinks.includes(previousLink)) {
      await debug.fatal('⚠️New links found, please update source⚠️', {
        collection: 'coconuts',
        connection,
      });
      return allLinks;
    }
    return allLinks;
  } catch (e) {
    // @ts-ignore
    await debug.fatal(e.message, {
      collection: 'coconuts',
      connection,
    });
    return [];
  }
}
