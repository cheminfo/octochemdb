import { defineConfig, globalIgnores } from 'eslint/config';
import cheminfo from 'eslint-config-cheminfo';
import globals from 'globals';

const jsdocRulesAsWarnings = Object.fromEntries(
  Object.keys({
    'jsdoc/check-access': 0,
    'jsdoc/check-alignment': 0,
    'jsdoc/check-line-alignment': 0,
    'jsdoc/check-param-names': 0,
    'jsdoc/check-property-names': 0,
    'jsdoc/check-syntax': 0,
    'jsdoc/check-tag-names': 0,
    'jsdoc/check-types': 0,
    'jsdoc/check-values': 0,
    'jsdoc/empty-tags': 0,
    'jsdoc/implements-on-classes': 0,
    'jsdoc/multiline-blocks': 0,
    'jsdoc/no-bad-blocks': 0,
    'jsdoc/no-defaults': 0,
    'jsdoc/no-multi-asterisks': 0,
    'jsdoc/no-types': 0,
    'jsdoc/no-undefined-types': 0,
    'jsdoc/reject-any-type': 0,
    'jsdoc/reject-function-type': 0,
    'jsdoc/require-asterisk-prefix': 0,
    'jsdoc/require-description': 0,
    'jsdoc/require-hyphen-before-param-description': 0,
    'jsdoc/require-jsdoc': 0,
    'jsdoc/require-param': 0,
    'jsdoc/require-param-description': 0,
    'jsdoc/require-param-name': 0,
    'jsdoc/require-param-type': 0,
    'jsdoc/require-property': 0,
    'jsdoc/require-property-description': 0,
    'jsdoc/require-property-name': 0,
    'jsdoc/require-property-type': 0,
    'jsdoc/require-returns': 0,
    'jsdoc/require-returns-check': 0,
    'jsdoc/require-returns-description': 0,
    'jsdoc/require-returns-type': 0,
    'jsdoc/require-throws': 0,
    'jsdoc/require-yields': 0,
    'jsdoc/require-yields-check': 0,
    'jsdoc/tag-lines': 0,
    'jsdoc/valid-types': 0,
  }).map((rule) => [rule, 'warn']),
);

export default defineConfig([
  globalIgnores([
    'coverage',
    'src/jsconfig.json',
    'src/types.d.ts',
    'src/stats',
    'src/nodeScripts',
    'src/utils/mf.js',
  ]),
  cheminfo,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...jsdocRulesAsWarnings,

      'no-await-in-loop': 'off',

      'unicorn/no-array-sort': 'warn',
      'unicorn/no-await-expression-member': 'warn',
      'unicorn/prefer-logical-operator-over-ternary': 'warn',
      'unicorn/text-encoding-identifier-case': 'warn',
      'unicorn/prefer-single-call': 'warn',
      'unicorn/prefer-code-point': 'warn',
      'unicorn/prefer-top-level-await': 'warn',
      'unicorn/consistent-destructuring': 'warn',
    },
  },
  {
    files: ['**/*.test.{js,mjs,cjs,jsx}'],
    rules: {
      'vitest/no-conditional-in-test': 'off',
      'vitest/no-conditional-expect': 'off',
      'vitest/no-conditional-tests': 'off',
      'vitest/require-hook': 'off',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-identical-title': 'warn',
    },
  },
]);
