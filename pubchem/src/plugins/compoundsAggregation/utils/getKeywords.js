export async function getKeywords(activityInfo, taxons) {
  const ignoreSet = new Set();

  for (let toIgnore of toIgnores) {
    ignoreSet.add(toIgnore);
  }

  const keywordsActivities = new Set();
  const keywordsTaxonomies = new Set();
  let stringsActivities = [];
  let stringsTaxonomies = [];
  for (let entry of activityInfo) {
    if (entry?.assay) {
      stringsActivities.push(entry.assay);
    }
  }
  for (let entry of taxons) {
    if (entry?.family) {
      stringsTaxonomies.push(entry.family);
    }
    if (entry?.genus) {
      stringsTaxonomies.push(entry.genus);
    }
    if (entry?.species) {
      stringsTaxonomies.push(entry.species);
    }
  }

  for (let string of stringsActivities) {
    let newKeywords = string
      .toLowerCase()
      .split(/\W+/)
      .filter((k) => k);
    for (let keyword of newKeywords) {
      if (!ignoreSet.has(keyword) && isNaN(Number(keyword))) {
        keywordsActivities.add(keyword);
      }
    }
  }
  for (let string of stringsTaxonomies) {
    let newKeywords = string
      .toLowerCase()
      .split(/\W+/)
      .filter((k) => k);
    for (let keyword of newKeywords) {
      if (!ignoreSet.has(keyword) && isNaN(Number(keyword))) {
        keywordsTaxonomies.add(keyword);
      }
    }
  }
  let uniqueStirngsActivities = [...new Set(stringsActivities)];
  let uniqueStirngsTaxonomies = [...new Set(stringsTaxonomies)];

  return [uniqueStirngsActivities, uniqueStirngsTaxonomies];
}

const toIgnores = [
  'the',
  'of',
  'and',
  'to',
  'a',
  'in',
  'for',
  'is',
  'on',
  'that',
  'by',
  'this',
  'with',
  'i',
  'you',
  'it',
  'not',
  'or',
  'be',
  'are',
  'from',
  'at',
  'as',
  'your',
  'all',
  'have',
  'new',
  'more',
  'an',
  'was',
  'we',
  'will',
  'home',
  'can',
  'us',
  'about',
  'if',
  'page',
  'my',
  'has',
  'search',
  'free',
  'but',
  'our',
  'one',
  'other',
  'do',
  'no',
  'information',
  'time',
  'they',
  'site',
  'he',
  'up',
  'may',
  'what',
  'which',
  'their',
  'news',
  'out',
  'use',
  'any',
  'there',
  'see',
  'only',
  'so',
  'his',
  'when',
  'contact',
  'here',
  'business',
  'who',
  'web',
  'also',
  'now',
  'help',
  'get',
  'pm',
  'view',
  'online',
  'c',
  'e',
  'first',
  'am',
  'been',
  'would',
  'how',
  'were',
  'me',
  's',
  'services',
  'some',
  'these',
  'click',
  'its',
  'like',
  'service',
  'x',
  'than',
  'find',
  'price',
  'date',
  'back',
  'top',
  'people',
  'had',
  'list',
  'name',
  'just',
  'over',
  'state',
  'year',
  'day',
  'into',
  'email',
  'two',
  'health',
  'n',
  'world',
  're',
  'next',
  'used',
  'go',
  'b',
  'work',
  'last',
  'most',
  'products',
  'music',
  'buy',
  'data',
  'make',
  'them',
  'should',
  'product',
  'system',
  'post',
  'her',
  'city',
  't',
  'add',
  'policy',
  'number',
  'such',
  'please',
  'available',
  'copyright',
  'support',
  'message',
  'after',
  'best',
  'software',
  'then',
  'jan',
  'good',
  'video',
  'well',
  'd',
  'where',
  'info',
  'rights',
  'public',
  'books',
  'high',
  'school',
  'through',
  'm',
  'each',
  'links',
  'she',
  'review',
  'years',
  'order',
  'very',
  'privacy',
  'book',
  'items',
  'company',
  'r',
  'read',
  'group',
  'sex',
  'need',
  'many',
  'user',
  'said',
  'de',
  'does',
  'set',
  'under',
  'general',
  'research',
  'university',
  'january',
  'mail',
  'full',
  'map',
  'reviews',
  'program',
  'life',
  'nci',
  'ug/ml',
  'ug',
  'ml',
  'nm',
  '%',
  ':',
  'nM',
];

export default toIgnores;
