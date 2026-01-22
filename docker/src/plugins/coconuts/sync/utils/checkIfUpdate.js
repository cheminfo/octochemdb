import fetch from 'node-fetch';

import debugLibrary from '../../../../utils/Debug.js';

const debug = debugLibrary('checkIfUpdate');
/**
 * Checks if the update link for MassBank data has changed, indicating that a new update is available.
 * This function fetches the MassBank download page, extracts the current download link,
 * and compares it with the previously link which will be defined as a constant in this function.
 * @async
 * @function checkIfUpdate
 * @param {string| undefined} previousLink - The previously used download link for MassBank data.
 * @param {string} connection - MongoDB connection instance for logging purposes.
 * @returns {Promise<{updateAvailable: boolean, newLink: string|null}>} An object indicating whether an update is available and the new download link if applicable.If not it return updateAvailable as false and newLink as null.
 */

export async function checkIfUpdate(previousLink, connection) {
  try {
    const response = await fetch(
      'https://coconut.naturalproducts.net/download',
    );
    const text = await response.text();
    const regex =
      /https:\/\/coconut\.s3\.uni-jena\.de\/prod\/downloads\/\d{4}-\d{2}\/coconut_csv-\d{2}-\d{4}\.zip/;

    const newLink = text?.match(regex)?.[0];

    const updateAvailable = newLink !== previousLink;

    return { updateAvailable, newLink: newLink ?? null };
  } catch (e) {
    await debug.fatal(e.message, {
      collection: 'massBank',
      connection,
      stack: e.stack,
    });
    return { updateAvailable: false, newLink: null };
  }
}
