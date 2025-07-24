const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { parse } = require('yaml');

// Utility function to convert string to kebab-case
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase to kebab-case
    .replace(/[\s_]+/g, '-') // spaces and underscores to hyphens
    .replace(/[^a-zA-Z0-9-]/g, '') // remove special characters
    .toLowerCase()
    .replace(/^-+|-+$/g, '') // remove leading/trailing hyphens
    .replace(/-+/g, '-'); // collapse multiple hyphens
}

// Function to get workspace folders from pnpm-workspace.yaml
function getWorkspaceFolders(): string[] {
  try {
    const workspaceContent = readFileSync('pnpm-workspace.yaml', 'utf8');
    const workspace = parse(workspaceContent);

    if (!workspace.packages) {
      return ['packages', 'apps', 'tooling', 'api'];
    }

    // Extract base folder names from patterns like "packages/**", "tooling/**"
    const folders = workspace.packages
      .filter((pkg: string) => pkg.includes('/**') || pkg.includes('/*'))
      .map((pkg: string) => {
        // Handle both "packages/**" and "packages/*" patterns
        return pkg.replace(/\/\*\*?$/, '').replace(/^['"]|['"]$/g, '');
      })
      .sort();

    if (folders.length === 0) {
      return ['packages', 'apps', 'tooling', 'api'];
    }

    return folders;
  } catch (error) {
    console.warn('Could not read pnpm-workspace.yaml, using default folders');
    return ['packages', 'apps', 'tooling', 'api'];
  }
}

module.exports = function generator(plop: any) {
  const workspaceFolders = getWorkspaceFolders();

  plop.setGenerator('init', {
    description: 'Generate a new package for the monorepo',
    prompts: [
      {
        type: 'list',
        name: 'workspace',
        message: 'Select target workspace:',
        choices: workspaceFolders,
        default: 'packages',
      },
      {
        type: 'input',
        name: 'name',
        message: 'Enter the name of the package?',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Package name is required';
          }
          return true;
        },
        filter: (input: string) => {
          // Convert to kebab-case and remove any scope prefix
          const cleaned = input.replace(/^@[^/]+\//, '');
          return toKebabCase(cleaned);
        },
      },
      {
        type: 'input',
        name: 'deps',
        message: 'Enter list of dependencies (space separated, optional)',
        default: '',
      },
      {
        type: 'confirm',
        name: 'isNpmPackage',
        message: 'Is this an npm package?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'isPublicPackage',
        message: 'Is this a public package?',
        default: false,
        when: (answers: any) => answers.isNpmPackage === true,
      },
      {
        type: 'list',
        name: 'licenseType',
        message: 'Select a license for this package:',
        choices: [
          { name: 'None', value: 'none' },
          { name: 'Empty LICENSE file', value: 'empty' },
          { name: 'MIT', value: 'mit' },
          { name: 'Apache 2.0', value: 'apache-2.0' },
          { name: 'GPL v3', value: 'gpl-3.0' },
          { name: 'BSD 3-Clause', value: 'bsd-3-clause' },
          { name: 'Mozilla Public License 2.0', value: 'mpl-2.0' },
          { name: 'LGPL v3', value: 'lgpl-3.0' },
        ],
        default: 'none',
      },
    ],
    actions: function (data: any) {
      const actions = [
        (answers: any) => {
          if (answers.name) {
            // Ensure name is in kebab-case
            const kebabName = toKebabCase(answers.name);

            if (kebabName.startsWith('@internal/') || kebabName.startsWith('@')) {
              answers.name = kebabName.replace(/^@[^/]+\//, '');
            } else {
              answers.name = kebabName;
            }
          }
          return 'Config sanitized';
        },
        {
          type: 'add',
          path: '{{ workspace }}/{{ name }}/eslint.config.js',
          templateFile: 'templates/eslint.config.js.hbs',
        },
        {
          type: 'add',
          path: '{{ workspace }}/{{ name }}/package.json',
          templateFile: 'templates/package.json.hbs',
        },
        {
          type: 'add',
          path: '{{ workspace }}/{{ name }}/tsconfig.json',
          templateFile: 'templates/tsconfig.json.hbs',
        },
        {
          type: 'add',
          path: '{{ workspace }}/{{ name }}/src/index.ts',
          template: "export const name = '{{ name }}';",
        },
        {
          type: 'add',
          path: '{{ workspace }}/{{ name }}/rollup.config.js',
          templateFile: 'templates/rollup.config.js.hbs',
        },
        {
          type: 'add',
          path: '{{ workspace }}/{{ name }}/vitest.config.ts',
          templateFile: 'templates/vitest.config.ts.hbs',
        },
        {
          type: 'add',
          path: '{{ workspace }}/{{ name }}/tsconfig.build.json',
          templateFile: 'templates/tsconfig.build.json.hbs',
        },
        {
          type: 'add',
          path: '{{ workspace }}/{{ name }}/README.md',
          templateFile: 'templates/README.md.hbs',
        },
        {
          type: 'add',
          path: '{{ workspace }}/{{ name }}/src/main.ts',
          templateFile: 'templates/src/main.ts.hbs',
        },
        {
          type: 'add',
          path: '{{ workspace }}/{{ name }}/tests/main.test.ts',
          templateFile: 'templates/tests/main.test.ts.hbs',
        },
      ];

      // Conditionally add release.config.js only if isNpmPackage is true
      if (data.isNpmPackage === true) {
        actions.push({
          type: 'add',
          path: '{{ workspace }}/{{ name }}/release.config.js',
          templateFile: 'templates/release.config.js.hbs',
        });
      }

      // Conditionally add LICENSE file based on licenseType
      if (data.licenseType === 'empty') {
        actions.push({
          type: 'add',
          path: '{{ workspace }}/{{ name }}/LICENSE',
          template: '',
        });
      } else if (data.licenseType === 'mit') {
        actions.push({
          type: 'add',
          path: '{{ workspace }}/{{ name }}/LICENSE',
          templateFile: 'templates/LICENSE_MIT',
        });
      } else if (data.licenseType === 'apache-2.0') {
        actions.push({
          type: 'add',
          path: '{{ workspace }}/{{ name }}/LICENSE',
          templateFile: 'templates/LICENSE_APACHE_2_0',
        });
      } else if (data.licenseType === 'gpl-3.0') {
        actions.push({
          type: 'add',
          path: '{{ workspace }}/{{ name }}/LICENSE',
          templateFile: 'templates/LICENSE_GPL_3_0',
        });
      } else if (data.licenseType === 'bsd-3-clause') {
        actions.push({
          type: 'add',
          path: '{{ workspace }}/{{ name }}/LICENSE',
          templateFile: 'templates/LICENSE_BSD_3_CLAUSE',
        });
      } else if (data.licenseType === 'mpl-2.0') {
        actions.push({
          type: 'add',
          path: '{{ workspace }}/{{ name }}/LICENSE',
          templateFile: 'templates/LICENSE_MPL_2_0',
        });
      } else if (data.licenseType === 'lgpl-3.0') {
        actions.push({
          type: 'add',
          path: '{{ workspace }}/{{ name }}/LICENSE',
          templateFile: 'templates/LICENSE_LGPL_3_0',
        });
      }

      // Add the package.json modify action
      actions.push({
        type: 'modify',
        path: '{{ workspace }}/{{ name }}/package.json',
        async transform(content: string, answers: any) {
          const pkg = JSON.parse(content);
          // Add user-specified dependencies
          if (answers.deps && answers.deps.trim()) {
            for (const dep of answers.deps.split(' ').filter(Boolean)) {
              try {
                const response = await fetch(
                  `https://registry.npmjs.org/-/package/${dep}/dist-tags`,
                );
                const json = await response.json();
                const version = (json as any).latest;
                if (!pkg.dependencies) pkg.dependencies = {};
                pkg.dependencies[dep] = `^${version}`;
              } catch (error) {
                console.warn(`Failed to fetch version for ${dep}, skipping...`);
              }
            }
          }
          // Add @internal/semantic-release to devDependencies if isNpmPackage is true
          if (answers.isNpmPackage === true) {
            if (!pkg.devDependencies) pkg.devDependencies = {};
            pkg.devDependencies['@internal/semantic-release'] = 'workspace:*';
          }
          // Sort dependencies and devDependencies alphabetically
          if (pkg.dependencies) {
            pkg.dependencies = Object.fromEntries(
              Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)),
            );
          }
          if (pkg.devDependencies) {
            pkg.devDependencies = Object.fromEntries(
              Object.entries(pkg.devDependencies).sort(([a], [b]) => a.localeCompare(b)),
            );
          }
          return JSON.stringify(pkg, null, 2);
        },
      } as any);

      // Add the final install and format action
      actions.push((async (answers: any) => {
        /**
         * Install deps and format everything
         */
        if (answers.name && answers.workspace) {
          try {
            execSync('pnpm i', { stdio: 'inherit' });
            execSync(
              `pnpm prettier --write ${answers.workspace}/${answers.name}/** --list-different`,
              { stdio: 'inherit' },
            );
            return `Package '${answers.name}' scaffolded successfully in '${answers.workspace}' workspace!`;
          } catch (error) {
            console.warn('Warning: Failed to install dependencies or format files');
            return `Package '${answers.name}' scaffolded in '${answers.workspace}' workspace (with warnings)`;
          }
        }
        return 'Package not scaffolded';
      }) as any);

      return actions;
    },
  });
};
