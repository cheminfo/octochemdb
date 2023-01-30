// this function should switch parser function by second argument (parserYear)
import { parseUsp2001To2004 } from './parseUsp2001To2004.js';
import { parseUsp2005 } from './parseUsp2005.js';
import { parseUsp2006 } from './parseUsp2006.js';

export function parsers(entry, parserYear) {
  switch (parserYear) {
    case '2001':
      return parseUsp2001To2004(entry);
    case '2002':
      return parseUsp2001To2004(entry);
    case '2003':
      return parseUsp2001To2004(entry);
    case '2004':
      return parseUsp2001To2004(entry);
    case '2005':
      return parseUsp2005(entry);
    case '2006':
      return parseUsp2006(entry);
    default:
      return null;
  }
}
