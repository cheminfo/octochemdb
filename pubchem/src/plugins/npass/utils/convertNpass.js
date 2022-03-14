import { readFileSync } from 'fs';
import { join } from 'path';

import { parse } from 'papaparse';

export function convertNpass(dirPath) {
  const general = parse(
    readFileSync(join(dirPath, 'nps general.txt'), 'utf8'),
    {
      header: true,
    },
  ).data;

  const activities = {};

  parse(readFileSync(join(dirPath, 'nps activities.txt'), 'utf8'), {
    header: true,
  }).data.forEach((entry) => {
    if (!activities[entry.np_id]) {
      activities[entry.np_id] = [];
    }
    activities[entry.np_id].push(entry);
  });

  const properties = {};
  parse(readFileSync(join(dirPath, 'nps properties.txt'), 'utf8'), {
    header: true,
  }).data.forEach((entry) => (properties[entry.np_id] = entry));

  const results = [];
  for (const item of general) {
    const property = properties[item.np_id];
    const activity = activities[item.np_id];
    const result = {
      ...item,
      smiles: property.canonical_smiles,
      activities: activity,
    };
    results.push(result);
  }
}
