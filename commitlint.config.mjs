export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0, 'never'],
    'type-enum': [
      1,
      'always',
      [
        'feat', // New features
        'fix', // Bug fixes
        'docs', // Documentation
        'chore', // Maintenance tasks
        'refactor', // Code refactoring
        'test', // Adding/updating tests
        'ci', // CI/CD changes
        'perf', // Performance improvements
        'style', // Code style/formatting
      ],
    ],
    'subject-max-length': [2, 'always', 150],
    'header-max-length': [2, 'always', 150],
    'body-max-line-length': [1, 'always', 100],
  },
};
