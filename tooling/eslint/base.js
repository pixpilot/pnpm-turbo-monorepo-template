import baseConfig from '@pixpilot/dev-config/eslint/base';
import jestConfig from '@pixpilot/dev-config/eslint/jest';
import turboPlugin from 'eslint-plugin-turbo';

const config = /** @type {any} */ ([
  {
    ignores: [
      '**/*.config.*',
      '.rollup.cache/**',
      '.cache/**',
      'dist/**',
      'coverage/**',
      'node_modules/**',
    ],
  },

  ...baseConfig,
  ...jestConfig,

  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      turbo: turboPlugin,
    },
  },
]);

export default config;
