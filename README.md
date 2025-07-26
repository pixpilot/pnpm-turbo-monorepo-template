# pnpm-turbo-monorepo-template

> ⚠️ **Opinionated Template:**
> This monorepo template is designed for our internal standards and workflows. Feel free to use, adapt, and extend it for your own projects.

A modern TypeScript monorepo template for npm packages, managed with pnpm and TurboRepo.

## ✨ Features

- Monorepo structure with workspaces
- TypeScript support
- Linting and formatting with ESLint and Prettier
- Build tooling with Rollup
- Easy dependency management with pnpm

## 🚀 Getting Started

1. Install dependencies:
   ```sh
   pnpm install
   ```
2. Build all packages:
   ```sh
   pnpm build
   ```
3. Run tests:
   ```sh
   pnpm test
   ```

## 📦 Packages

- `packages/utils` – Example utility package

### 🏷️ Package Naming Convention

In this template, we use `@pixpilot` as a placeholder for package names. As a user, you might want to replace it with your own organization or project name.

## 🚢 Releasing Packages (Independent Versioning)

This monorepo uses [semantic-release-monorepo](https://github.com/pmowrer/semantic-release-monorepo) for fully automated, independent versioning and publishing of each package.

### 📝 How to Release

1. Ensure you have an `NPM_TOKEN` with publish rights set in your environment (for CI/CD, set as a secret).
2. Run the following command from the root:
   ```sh
   pnpm release
   ```
   This will run semantic-release in each workspace package, versioning and publishing only those with relevant changes.

- Each package is versioned independently.
- Git tags are created in the format `<package-name>-<version>`.
- See `release.config.js` for configuration details.

For more, see the [semantic-release-monorepo docs](https://github.com/pmowrer/semantic-release-monorepo).

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

[MIT](LICENSE)
