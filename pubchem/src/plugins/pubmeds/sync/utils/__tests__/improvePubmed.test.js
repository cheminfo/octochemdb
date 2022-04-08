import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'arraybuffer-xml-parser';

import Debug from '../../../../../utils/Debug.js';
import improvePubmed from '../improvePubmed.js';

const debug = Debug('testPubMeds');
test('pubmeds', () => {
  const parsed = parse(readFileSync(join(__dirname, 'data.xml')), {
    textNodeName: '_text',
  });

  const results = [];
  for (let entry of parsed.PubmedArticleSet.PubmedArticle.slice(0, 10)) {
    if (!entry.PubmedCitation) {
      debug(`No PubmedCitation' ${entry}`);
    }
    results.push(improvePubmed(entry.PubmedCitation));
  }

  expect(results[0]).toStrictEqual({
    _id: { _text: 1, $Version: 1 },
    _seq: 0,
    data: {
      $status: 'MEDLINE',
      $owner: 'NLM',
      pmid: { text: 1, $version: 1 },
      dateCompleted: { year: 1976, month: 1, day: 16 },
      dateRevised: { year: 2019, month: 2, day: 8 },
      article: {
        $pubModel: 'Print',
        journal: {
          issn: { text: '0006-2944', $issnType: 'Print' },
          journalIssue: {
            $citedMedium: 'Print',
            volume: 13,
            issue: 2,
            pubDate: { year: 1975, month: 'Jun' },
          },
          title: 'Biochemical medicine',
          isoAbbreviation: 'Biochem Med',
        },
        articleTitle:
          'Formate assay in body fluids: application in methanol poisoning.',
        pagination: { pubmedPgn: '117-26' },
        authorList: {
          $completeYn: 'Y',
          author: [
            {
              $validYn: 'Y',
              lastName: 'Makar',
              foreName: 'A B',
              initials: 'AB',
            },
            {
              $validYn: 'Y',
              lastName: 'McMartin',
              foreName: 'K E',
              initials: 'KE',
            },
            { $validYn: 'Y', lastName: 'Palese', foreName: 'M', initials: 'M' },
            {
              $validYn: 'Y',
              lastName: 'Tephly',
              foreName: 'T R',
              initials: 'TR',
            },
          ],
        },
        language: 'eng',
        grantList: {
          $completeYn: 'Y',
          grant: {
            grantId: 'MC_UU_12013/5',
            agency: 'MRC',
            country: 'United Kingdom',
          },
        },
        publicationTypeList: {
          publicationType: [
            { text: 'Journal Article', $ui: 'D016428' },
            { text: "Research Support, U.S. Gov't, P.H.S.", $ui: 'D013487' },
          ],
        },
      },
      pubmedJournalInfo: {
        country: 'United States',
        pubmedTa: 'Biochem Med',
        nlmUniqueId: 151424,
        issnLinking: '0006-2944',
      },
      chemicalList: {
        chemical: [
          {
            registryNumber: 0,
            nameOfSubstance: { text: 'Formates', $ui: 'D005561' },
          },
          {
            registryNumber: '142M471B3J',
            nameOfSubstance: { text: 'Carbon Dioxide', $ui: 'D002245' },
          },
          {
            registryNumber: 'EC 1.2.-',
            nameOfSubstance: {
              text: 'Aldehyde Oxidoreductases',
              $ui: 'D000445',
            },
          },
          {
            registryNumber: 'Y4S76JWI15',
            nameOfSubstance: { text: 'Methanol', $ui: 'D000432' },
          },
        ],
      },
      citationSubset: 'IM',
      meshHeadingList: {
        meshHeading: [
          {
            descriptorName: {
              text: 'Aldehyde Oxidoreductases',
              $ui: 'D000445',
              $majorTopicYn: 'N',
            },
            qualifierName: {
              text: 'metabolism',
              $ui: 'Q000378',
              $majorTopicYn: 'N',
            },
          },
          {
            descriptorName: {
              text: 'Animals',
              $ui: 'D000818',
              $majorTopicYn: 'N',
            },
          },
          {
            descriptorName: {
              text: 'Body Fluids',
              $ui: 'D001826',
              $majorTopicYn: 'N',
            },
            qualifierName: {
              text: 'analysis',
              $ui: 'Q000032',
              $majorTopicYn: 'Y',
            },
          },
          {
            descriptorName: {
              text: 'Carbon Dioxide',
              $ui: 'D002245',
              $majorTopicYn: 'N',
            },
            qualifierName: {
              text: 'blood',
              $ui: 'Q000097',
              $majorTopicYn: 'N',
            },
          },
          {
            descriptorName: {
              text: 'Formates',
              $ui: 'D005561',
              $majorTopicYn: 'N',
            },
            qualifierName: [
              { text: 'blood', $ui: 'Q000097', $majorTopicYn: 'N' },
              { text: 'poisoning', $ui: 'Q000506', $majorTopicYn: 'Y' },
            ],
          },
          {
            descriptorName: {
              text: 'Haplorhini',
              $ui: 'D000882',
              $majorTopicYn: 'N',
            },
          },
          {
            descriptorName: {
              text: 'Humans',
              $ui: 'D006801',
              $majorTopicYn: 'N',
            },
          },
          {
            descriptorName: {
              text: 'Hydrogen-Ion Concentration',
              $ui: 'D006863',
              $majorTopicYn: 'N',
            },
          },
          {
            descriptorName: {
              text: 'Kinetics',
              $ui: 'D007700',
              $majorTopicYn: 'N',
            },
          },
          {
            descriptorName: {
              text: 'Methanol',
              $ui: 'D000432',
              $majorTopicYn: 'N',
            },
            qualifierName: {
              text: 'blood',
              $ui: 'Q000097',
              $majorTopicYn: 'N',
            },
          },
          {
            descriptorName: {
              text: 'Methods',
              $ui: 'D008722',
              $majorTopicYn: 'N',
            },
          },
          {
            descriptorName: {
              text: 'Pseudomonas',
              $ui: 'D011549',
              $majorTopicYn: 'N',
            },
            qualifierName: {
              text: 'enzymology',
              $ui: 'Q000201',
              $majorTopicYn: 'N',
            },
          },
        ],
      },
    },
  });
});
