// this function should switch parser function by second argument (parserYear)
import { parse01To04 } from './parsersFrom01To23/parse01To04.js';
import { parse05 } from './parsersFrom01To23/parse05.js';
import { parse06 } from './parsersFrom01To23/parse06.js';
import { parse07To21 } from './parsersFrom01To23/parse07To21.js';
import { parse22a } from './parsersFrom01To23/parse22a.js';
import { parse22bTo23 } from './parsersFrom01To23/parse22bTo23.js';

export function parsers(entry, parserYear) {
  switch (parserYear) {
    case '2001':
      return parse01To04(entry);
    case '2002':
      return parse01To04(entry);
    case '2003':
      return parse01To04(entry);
    case '2004':
      return parse01To04(entry);
    case '2005':
      return parse05(entry);
    case '2006':
      return parse06(entry);
    case '2007':
      return parse07To21(entry);
    case '2008':
      return parse07To21(entry);
    case '2009':
      return parse07To21(entry);
    case '2010':
      return parse07To21(entry);
    case '2011':
      return parse07To21(entry);
    case '2012':
      return parse07To21(entry);
    case '2013':
      return parse07To21(entry);
    case '2014':
      return parse07To21(entry);
    case '2015':
      return parse07To21(entry);
    case '2016':
      return parse07To21(entry);
    case '2017':
      return parse07To21(entry);
    case '2018':
      return parse07To21(entry);
    case '2019':
      return parse07To21(entry);
    case '2020':
      return parse07To21(entry);
    case '2021':
      return parse07To21(entry);
    case '2022a':
      return parse22a(entry);
    case '2022b':
      return parse22bTo23(entry);
    case '2023':
      return parse22bTo23(entry);
    default:
      return null;
  }
}
