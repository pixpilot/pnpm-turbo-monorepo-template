import { createNodejsEslintConfig } from '@pixpilot/dev-config';
import turboPlugin from 'eslint-plugin-turbo';

/** @type {any} */
const config = createNodejsEslintConfig([
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      turbo: turboPlugin,
    },
  },
]);

export default config;
