import makeConfig from '@pixpilot/eslint-config';
import turboPlugin from 'eslint-plugin-turbo';

/**
 * @type {ReturnType<typeof makeConfig>}
 */
const baseConfig = makeConfig(
  {
    typescript: {
      tsconfigPath: './tsconfig.json',
    },
    pnpm: false,
  },
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      turbo: turboPlugin,
    },
  },
);

export default baseConfig;
