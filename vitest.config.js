/**
 * Vitest configuration with a custom test sequencer that enforces a specific
 * execution order across sync and aggregation plugin test suites.
 *
 * Tests share a single MongoDB instance and depend on each other's data:
 * sync tests populate collections, aggregation/read tests rely on those
 * collections being present. Many tests `while (true)` busy-wait for
 * documents to appear, so they MUST run after the corresponding sync test —
 * `fileParallelism: false` forces serial file execution and the sequencer
 * below decides the order.
 *
 * Order of phases (smaller priority runs first):
 *
 *  0. Pure unit tests with no DB dependency (parsers, http helpers, etc.)
 *  1. syncCompounds       – populates the compounds collection that almost
 *                           everything else depends on.
 *  2. syncTaxonomies      – needed before bioassays.
 *  3. syncBioassays       – depends on compounds + taxonomies.
 *  4. syncPatents         – patents must exist before compoundPatents links.
 *  5. syncCompoundPatents – patent ↔ compound relations.
 *  6. syncGNPS            – must finish before aggregation plugins read it.
 *  7. Other sync plugins  – no hard ordering between them.
 *  7.5 aggregateActivesOrNaturals – produces the activesOrNaturals
 *                           collection that lookup tests and
 *                           inSilicoFragments read from.
 *  7.7 getMeshTerms      – has the side effect of writing
 *                           `data.compounds` onto every pubmeds doc
 *                           (via `updateMany`), which the pubmeds
 *                           id/ids/search snapshots depend on.
 *  8. Read/lookup tests   – id/ids/search/fromEM/fromMF/admin/etc. that
 *                           query already-populated collections.
 *  9. inSilicoFragments   – aggregate that depends on compounds + spectra.
 * 10. Other aggregations  – run last; read from every populated collection.
 */
import { defineConfig } from 'vitest/config';
import { BaseSequencer } from 'vitest/node';

const orderingRules = [
  { priority: 1, pattern: /\/compounds\/.*\/syncCompounds\.test\.js$/ },
  { priority: 2, pattern: /\/taxonomies\/.*\/syncTaxonomies\.test\.js$/ },
  { priority: 3, pattern: /\/bioassays\/.*\/syncBioassays\.test\.js$/ },
  { priority: 4, pattern: /\/patents\/.*\/syncPatents\.test\.js$/ },
  {
    priority: 5,
    pattern: /\/compoundPatents\/.*\/syncCompoundPatents\.test\.js$/,
  },
  { priority: 6, pattern: /\/gnps\/.*\/syncGNPS\.test\.js$/ },
  { priority: 7, pattern: /\/sync[A-Z][^/]*\.test\.js$/ },
  { priority: 7.5, pattern: /\/aggregateActivesOrNaturals\.test\.js$/ },
  { priority: 7.7, pattern: /getMeshTerms\.test\.js$/ },
  { priority: 9, pattern: /\/inSilicoFragments\//i },
  { priority: 10, pattern: /\/aggregate[^/]*\.test\.js$/i },
  { priority: 10, pattern: /\/aggregates\// },
  { priority: 8, pattern: /OctoChemConnection\.test\.js$/ },
  { priority: 8, pattern: /entriesAdmin\.test\.js$/ },
  {
    priority: 8,
    pattern: /\/(id|ids|search|fromEM|fromMF|fromSmiles|nEntries)\.test\.js$/,
  },
];

function priorityFor(file) {
  const path = typeof file === 'string' ? file : file.moduleId || file.filepath;
  for (const { priority, pattern } of orderingRules) {
    if (pattern.test(path)) return priority;
  }
  return 0;
}

export default defineConfig({
  test: {
    testTimeout: 80000,
    pool: 'forks',
    fileParallelism: false,
    coverage: {
      include: ['src/**/*.js'],
      provider: 'v8',
    },
    snapshotFormat: {
      maxOutputLength: Number.MAX_SAFE_INTEGER,
    },
    sequence: {
      sequencer: class Sequencer extends BaseSequencer {
        async shard(files) {
          return files;
        }

        async sort(files) {
          return [...files].sort((a, b) => {
            const priorityDiff = priorityFor(a) - priorityFor(b);
            if (priorityDiff !== 0) return priorityDiff;
            const pathA = typeof a === 'string' ? a : a.moduleId || a.filepath;
            const pathB = typeof b === 'string' ? b : b.moduleId || b.filepath;
            return pathA.localeCompare(pathB);
          });
        }
      },
    },
  },
});
