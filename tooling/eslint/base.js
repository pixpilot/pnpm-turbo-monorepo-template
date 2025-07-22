import eslintConfig from '@pixpilot/dev-config/eslint';
import jestConfig from '@pixpilot/dev-config/eslint-jest';
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

  ...eslintConfig,
  ...jestConfig,

  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      turbo: turboPlugin,
    },
  },
]);

export default config;
