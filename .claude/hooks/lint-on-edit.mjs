// Runs ESLint (with --fix) on every .ts/.tsx file Claude edits.
// Exit code 2 sends the errors back to Claude so it fixes them itself.
import { execFileSync } from 'node:child_process';

let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let file;
  try {
    file = JSON.parse(raw || '{}').tool_input?.file_path;
  } catch {
    process.exit(0);
  }
  const normalized = (file ?? '').replaceAll('\\', '/');
  if (!/\.(ts|tsx)$/.test(normalized)) process.exit(0);
  if (/\/(node_modules|dist|components\/ui)\//.test(normalized)) process.exit(0);

  try {
    execFileSync('npx', ['eslint', '--fix', '--max-warnings', '0', file], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
    process.exit(0);
  } catch (error) {
    const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
    process.stderr.write(`ESLint found problems in ${file}. Fix them before continuing:\n${out}\n`);
    process.exit(2);
  }
});
