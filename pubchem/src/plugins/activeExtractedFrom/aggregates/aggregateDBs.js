/*
db.activesOrNaturals_tmp.aggregate([
    { $project: { taxonomies: '$data.taxonomies' } },
    { $unwind: '$taxonomies' },
    {
      $project: {
        superkingdom: '$taxonomies.superkingdom',
        kingdom: '$taxonomies.kingdom',
        phylum: '$taxonomies.phylum',
        class: '$taxonomies.class',
      },
    },
    {
      $group: {
        _id: {
          $concat: ['$_id', '$superkingdom', 'kingdom', '$phylum', '$class'],
        },
        superkingdom: { $first: '$superkingdom' },
        kingdom: { $first: '$kingdom' },
        phylum: { $first: '$phylum' },
        class: { $first: '$class' },
      },
    },
    {
      $group: {
        _id: { $concat: ['$superkingdom', 'kingdom', '$phylum', '$class'] },
        count: { $sum: 1 },
        superkingdom: { $first: '$superkingdom' },
        kingdom: { $first: '$kingdom' },
        phylum: { $first: '$phylum' },
        class: { $first: '$class' },
      },
    },
    { $out: { db: 'pubchem', coll: 'extractedFrom' } },
  ])
  .pretty();
*/
