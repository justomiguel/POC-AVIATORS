/**
 * Desarrollo: Tailwind en --watch + regenera gas/tailwind-include.html
 * cuando cambia gas/tailwind-built.css (mismo resultado que npm run build:css).
 */
import { existsSync, readFileSync, watchFile, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn, spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const builtPath = join(root, 'gas', 'tailwind-built.css');
const outHtml = join(root, 'gas', 'tailwind-include.html');

const twArgs = [
  'tailwindcss',
  '-i',
  './gas/tailwind-input.css',
  '-o',
  './gas/tailwind-built.css',
];

const shell = process.platform === 'win32';

function wrapInclude() {
  if (!existsSync(builtPath)) return;
  const css = readFileSync(builtPath, 'utf8');
  const out =
    '<style>\n' +
    '/* Tailwind + app utilities — run: npm run build:css */\n' +
    css.trim() +
    '\n</style>\n';
  writeFileSync(outHtml, out, 'utf8');
  console.log('[watch:css] tailwind-include.html actualizado');
}

let debounceTimer;
function debouncedWrap() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(wrapInclude, 150);
}

spawnSync('npx', twArgs, { cwd: root, stdio: 'inherit', shell: shell });
wrapInclude();

const tw = spawn('npx', twArgs.concat('--watch'), {
  cwd: root,
  stdio: 'inherit',
  shell: shell,
});

watchFile(builtPath, { interval: 300 }, function (curr, prev) {
  if (curr.mtimeMs !== prev.mtimeMs) debouncedWrap();
});

function stop() {
  try {
    tw.kill('SIGTERM');
  } catch (_) {}
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

tw.on('error', function (err) {
  console.error(err);
  process.exit(1);
});
