import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readText(relPath) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, 'utf8').trim();
}

function writeText(relPath, content) {
  writeFileSync(join(root, relPath), content, 'utf8');
  console.log(`→ ${relPath} (${content.length} bytes)`);
}

const visCss = readText('gas/vendor/vis-network/vis-network.min.css');
const visJs = readText('gas/vendor/vis-network/vis-network.min.js');

if (!visCss || !visJs) {
  console.error(
    'build:kg-vis: missing gas/vendor/vis-network/vis-network.min.{css,js}',
  );
  process.exit(1);
}

writeText(
  'gas/knowledge-graph-vis-include.html',
  `<style>\n${visCss}\n</style><script>\n${visJs}\n</script>\n`,
);

const cytoscapeJs = readText('vendor/cytoscape/cytoscape.min.js');
if (cytoscapeJs) {
  writeText('gas/kg-lib-cytoscape.html', `${cytoscapeJs}\n`);
} else {
  console.warn('skip: vendor/cytoscape/cytoscape.min.js not found');
}

const graphologyJs = readText('vendor/sigma/graphology.umd.min.js');
const sigmaPolyfill = readText('vendor/sigma/kg-webgl-polyfill.js');
const sigmaJs = readText('vendor/sigma/sigma.min.js');

if (graphologyJs) {
  writeText('gas/kg-lib-graphology.html', `${graphologyJs}\n`);
}

if (sigmaPolyfill && graphologyJs && sigmaJs) {
  writeText(
    'gas/kg-lib-sigma.html',
    `<script>\n${sigmaPolyfill}\n</script><script>\n${graphologyJs}\n</script><script>\n${sigmaJs}\n</script>\n`,
  );
} else if (sigmaPolyfill || sigmaJs) {
  console.warn('skip: incomplete vendor/sigma bundle (need polyfill, graphology, sigma)');
}
