// Wrapper script to run the Plop generator using tsx
import { spawn } from 'child_process';

const args = process.argv.slice(2);

const child = spawn('npx', ['tsx', 'turbo/generators/config.ts', ...args], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code));
