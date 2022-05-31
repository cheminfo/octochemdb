/*
db.activesOrNaturals.aggregate([
    {
      $limit: 10000,
    },
    { $project: {  activities: "$data.activities" } },
    { $unwind: '$activities' },
    { $project: { taxonomy: "$activities.taxonomy" } },
    { $project: {
      superkingdom: '$taxonomy.superkingdom',
      kingdom: '$taxonomy.kingdom',
      phylum: '$taxonomy.phylum',
      class: '$taxonomy.class',
    }},
    { $group: {
     _id: { $concat: ['$_id', '$superkingdom', 'kingdom', '$phylum', '$class'] },
      superkingdom: { $first: '$superkingdom' },
      kingdom: { $first: '$kingdom' },
      phylum: { $first: '$phylum' },
      class: { $first: '$class' },
    }},
    { $group: {
      _id: { $concat: ['$superkingdom', 'kingdom', '$phylum', '$class'] },
      count: { $sum: 1 },
      superkingdom: { $first: '$superkingdom' },
      kingdom: { $first: '$kingdom' },
      phylum: { $first: '$phylum' },
      class: { $first: '$class' },
    }},
    { $out: { db: 'pubchem', coll: 'activeAgainst' } },
  ]).pretty();
*/
