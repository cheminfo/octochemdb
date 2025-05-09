import { fileCollectionFromPath } from 'filelist-utils';
import OCL from 'openchemlib';
import csvParser from 'csv-parser';
import debugLibrary from '../../../../utils/Debug.js';
import unzipper from 'unzipper';  // Using unzipper to extract the contents of the ZIP
import fs from 'fs';
import path from 'path';
import { getNoStereosFromCache } from '../../../../utils/getNoStereosFromCache.js';

const debug = debugLibrary('parseCoconuts');

/**
 * @description Parse the coconuts CSV file from the ZIP and yield results for MongoDB
 * @param {*} zipPath path to the zip file
 * @param {*} connection MongoDB connection (for logging)
 * @yields {Object} yields MongoDB-ready document
 */
export async function* parseCoconuts(zipPath, connection) {
  try {
    let folderPath;
    if (process.env.NODE_ENV === 'test') {
      folderPath = zipPath.replace(/data\/.*/, 'data/');
    } else {
      folderPath = zipPath.replace(/full\/.*/, 'full/');
    }

    // Get the file collection from the path
    const fileCollection = await fileCollectionFromPath(folderPath, {
      unzip: { zipExtensions: [] }, // Ensuring it's not trying to unzip directly
    });

    // Sort files by last modified and select the most recent one
    let fileToRead = fileCollection.files.sort((a, b) => b.lastModified - a.lastModified)[0];

    // Adjust relativePath based on environment
    if (process.env.NODE_ENV === 'test') {
      fileToRead.relativePath = folderPath.replace('data/', '') + fileToRead.relativePath;
    } else {
      fileToRead.relativePath = folderPath.replace('full/', '') + fileToRead.relativePath;
    }

   

    // Extract the ZIP file using unzipper
    const zipFilePath = path.resolve(fileToRead.relativePath);
    const directory = await unzipper.Open.file(zipFilePath);
    
    // Find the CSV file inside the ZIP
    const csvFile = directory.files.find(file => file.path.endsWith('.csv'));

    if (!csvFile) {
      throw new Error('CSV file not found in ZIP archive');
    }

    // Open the CSV file as a stream
    const csvStream = csvFile.stream().pipe(csvParser());


    // Parsing each row in the CSV stream
    for await (const row of csvStream) {
    //  console.log('Row:', row.canonical_smiles);

      try {
        // Skip if required fields are missing
        if (!row.identifier || !row.canonical_smiles) continue;
        // Parse the molecule using OpenChemLib

        const oclMolecule = OCL.Molecule.fromSmiles(
          row.canonical_smiles,
        );
        const ocl = await getNoStereosFromCache(
          oclMolecule,
          connection,
          'coconuts',
        );
      

        // Process taxonomies and comments
        const taxonomies = [];
        if (row.organisms !== '') {
          const organismsList = row.organisms.split('|');
          for (const entry of organismsList) {
           
              taxonomies.push({ species: entry });
            
          }
        } 

        // Prepare the result document
        const result = {
          _id: row.identifier,
          data: {
            ocl,
          },
        };

        if (row.cas!== '') result.data.cas = row.cas;
        if (row.iupac_name) result.data.iupacName = row.iupac_name;
        if (taxonomies.length > 0) result.data.taxonomies = taxonomies;
        if(row.name!== '') result.data.name = row.name;

      
        yield result;
      } catch (e) {
        debug.error(
          `Error processing row ${row.identifier}: ${e.message}`,
          {
            collection: 'coconuts',
            connection,
            stack: e.stack,
          },
        );
      }
    }

  } catch (e) {
    if (connection) {
      await debug.fatal(e.message, {
        collection: 'coconuts',
        connection,
        stack: e.stack,
      });
    }
  }
}
