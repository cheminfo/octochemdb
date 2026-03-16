import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('MASSBANK');

/**
 * Checks whether the current MassBank download URL still appears in the
 * latest GitHub release assets.  If the link is missing a fatal warning is
 * logged so that the source URL can be updated.
 *
 * @param {string} previousLink - The MassBank download URL currently configured
 * @param {OctoChemConnection} connection - The OctoChemConnection instance
 * @returns {Promise<string[]>} All download links found on the latest release page
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
    const expandedAssetsHref = downloadsSectionMatch?.[1];
    if (!expandedAssetsHref) {
      await debug.fatal('⚠️Could not find expanded_assets URL on release page⚠️', {
        collection: 'massBank',
        connection,
      });
      return [];
    }
    const expandedAssetsUrl = await fetch(expandedAssetsHref);
    const expandedAssetsText = await expandedAssetsUrl.text();
    const rawLinks = expandedAssetsText.match(
      /href="([^"]*\/(?:releases\/download|archive\/refs\/tags)\/[^"]+)"/g,
    );
    const allLinks = (rawLinks ?? []).map(
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
    const err = e instanceof Error ? e : new Error(String(e));
    await debug.fatal(err.message, {
      collection: 'massBank',
      connection,
    });
    return [];
  }
}
