module.exports = {
  '*.{ts,tsx}': () => ['pnpm run typecheck'],
  '*.{ts,tsx,js,jsx,yml}': () => ['pnpm run lint:fix', 'pnpm run format:fix'],
};
