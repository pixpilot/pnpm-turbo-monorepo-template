import { packageGenerator } from '@pixpilot/workspace-package-generator';

module.exports = function generator(plop: unknown) {
  packageGenerator(plop, {
    author: '',
    baseRepoUrl: '',
    defaultBundler: 'tsc',
    orgName: '',
  });
};
