export default {
  branches: [
    // Production branch for stable releases (e.g., 1.5.0)
    'main',
    {
      /*
        The 'next' branch is used for pre-releases (e.g., release candidates like 1.6.0-rc.1).
        - Merge features into 'next' to publish RC/pre-release versions.
        - Use this branch to test upcoming changes before merging to 'main'.
        - Once stable, merge 'next' into 'main' for a production release.
        - To work on pre-releases, checkout the 'next' branch:
            git checkout next
      */
      name: 'next',
      prerelease: 'rc',
      channel: 'next',
    },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
  ],
};
