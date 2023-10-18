import { test, expect } from 'vitest';

import { parseHtmlEntities } from '../parseHtmlEntities';

test('parseHtmlEntities', async () => {
  const text1 =
    'CAMEO Chemicals is a chemical database designed for people who are involved in hazardous material incident response and planning. CAMEO Chemicals contains a library with thousands of datasheets containing response-related information and recommendations for hazardous materials that are commonly transported, used, or stored in the United States. CAMEO Chemicals was developed by the National Oceanic and Atmospheric Administration&apos;s Office of Response and Restoration in partnership with the Environmental Protection Agency&apos;s Office of Emergency Management.';
  const text2 =
    'https://www.ilo.org/dyn/icsc/showcard.display?p_version=2&amp;p_card_id=043';

  const result1 = parseHtmlEntities(text1);
  const result2 = parseHtmlEntities(text2);
  expect(result2).toMatchInlineSnapshot(
    '"https://www.ilo.org/dyn/icsc/showcard.display?p_version=2&p_card_id=043"',
  );
  expect(result1).toMatchInlineSnapshot(
    '"CAMEO Chemicals is a chemical database designed for people who are involved in hazardous material incident response and planning. CAMEO Chemicals contains a library with thousands of datasheets containing response-related information and recommendations for hazardous materials that are commonly transported, used, or stored in the United States. CAMEO Chemicals was developed by the National Oceanic and Atmospheric Administration\'s Office of Response and Restoration in partnership with the Environmental Protection Agency\'s Office of Emergency Management."',
  );
  const text3 =
    'temperature greater than 80 \u00B0C in an essentially dry process';
  const result3 = parseHtmlEntities(text3);
  expect(result3).toMatchInlineSnapshot(
    '"temperature greater than 80 °C in an essentially dry process"',
  );
});
