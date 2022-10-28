import { XMLParser } from 'fast-xml-parser';
import fetch from 'node-fetch';
/**
 * @description Fetches the titles of the patents from PubChem associated with a given Patent ID
 * @param {String} patentID
 * @return  Title of patent
 */

export async function fetchPatentsTitles(patentID) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/patent/${patentID}`;
  // get text from the page
  const response = await fetch(url);
  const text = await response.text();
  const parser = new XMLParser();
  let jObj = parser.parse(text);
  const title = jObj.html.head.meta.meta.title;
  return title;
}
