import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('COCONUT');

/**
 * Verifies that `previousLink` still appears on the COCONUT downloads page.
 * When the link is missing a fatal alert is sent via `debug.fatal` to signal
 * that the source URL needs to be updated.
 *
 * @param {string} previousLink - The expected download URL to verify.
 * @param {OctoChemConnection} connection - Active database connection wrapper
 *   used to report link-change alerts via `debug.fatal`.
 * @returns {Promise<string[]>} All download URLs currently found on the COCONUT
 *   downloads page (regardless of whether `previousLink` matched).
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
    /** @type {string[]} */
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
    const err = e instanceof Error ? e : new Error(String(e));
    await debug.fatal(err.message, {
      collection: 'coconuts',
      connection,
      stack: err.stack,
    });
    return [];
  }
}
