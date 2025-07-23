// plopfile.ts (copied from turbo/generators/config.ts)

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

    // Extract base folder names from patterns like "apps/*", "packages/*"
    return workspace.packages
      .filter((pkg: string) => pkg.endsWith('/*'))
      .map((pkg: string) => pkg.replace('/*', ''))
      .sort();
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
        message: 'Which workspace folder would you like to create the package in?',
        choices: workspaceFolders,
        default: 'packages',
      },
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the package?',
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
        message:
          'Enter a space separated list of dependencies you would like to install (optional)',
        default: '',
      },
    ],
    actions: [
      (answers: any) => {
        if (answers.name) {
          // Ensure name is in kebab-case
          const kebabName = toKebabCase(answers.name);

          if (kebabName.startsWith('@acme/') || kebabName.startsWith('@')) {
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
      {
        type: 'modify',
        path: '{{ workspace }}/{{ name }}/package.json',
        async transform(content: string, answers: any) {
          if (answers.deps && answers.deps.trim()) {
            const pkg = JSON.parse(content);
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
            return JSON.stringify(pkg, null, 2);
          }
          return content;
        },
      },
      async (answers: any) => {
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
      },
    ],
  });
};
