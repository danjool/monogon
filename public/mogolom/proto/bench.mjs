// Benchmark: for each corpus ERD, score edge-edge / edge-node crossings for
//   1. the original syntax as written,
//   2. the deterministic spanning-tree preprocessing,
//   3. exhaustive search over non-tree orientations (when 2^k is affordable).
//
// Usage: node bench.mjs [--emit]   (--emit writes optimized .mmd files to out/)

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parseErd, serializeErd } from './parse-erd.mjs';
import { scoreErd } from './scorer.mjs';
import { preprocess } from './preprocess.mjs';
import { search } from './pipeline.mjs';

const MAX_EXHAUSTIVE_K = 16;
const emit = process.argv.includes('--emit');

const corpusDir = join(import.meta.dirname, 'corpus');
const outDir = join(import.meta.dirname, 'out');
if (emit) mkdirSync(outDir, { recursive: true });

const fmt = (s) => `EE ${String(s.edgeEdge).padStart(3)}  EN ${String(s.edgeNode).padStart(3)}`;

const rows = [];
const files = readdirSync(corpusDir)
  .filter((f) => f.endsWith('.mmd') && !f.endsWith('.ideal.mmd'))
  .sort();
for (const file of files) {
  const code = readFileSync(join(corpusDir, file), 'utf8');
  const floorMatch = code.match(/%% floor:\s*(\d+)/);
  const floor = floorMatch ? parseInt(floorMatch[1], 10) : null;
  const parsed = parseErd(code);
  if (parsed.other.length) {
    console.warn(`  [warn] ${file}: ${parsed.other.length} unparsed line(s):`, parsed.other);
  }

  const n = parsed.firstMention.length;
  const m = parsed.relationships.length;

  const t0 = performance.now();
  const original = scoreErd(parsed);
  const pre = preprocess(parsed);
  const preScore = scoreErd(pre);
  const t1 = performance.now();

  const exh = await search(parsed, { maxExhaustiveK: MAX_EXHAUSTIVE_K });
  const t2 = performance.now();

  rows.push({
    name: basename(file, '.mmd'),
    n, m, k: pre.nonTreeCount,
    original, preScore, exh, floor,
    preMs: t1 - t0,
    exhMs: t2 - t1,
  });

  if (emit) {
    writeFileSync(join(outDir, file), serializeErd(exh.variant) + '\n');
  }
}

console.log('\n  diagram              entities  rels  non-tree | original     | spanning-tree | pipeline search');
console.log('  ' + '-'.repeat(104));
for (const r of rows) {
  const floorNote = r.floor !== null ? `, certified floor ${r.floor}` : '';
  const exhCol = `${fmt(r.exh.score)}  (${r.exh.evals} evals, ${r.exhMs.toFixed(0)}ms${floorNote})`;
  console.log(
    `  ${r.name.padEnd(20)} ${String(r.n).padStart(8)} ${String(r.m).padStart(5)} ${String(r.k).padStart(9)}` +
    ` | ${fmt(r.original)} | ${fmt(r.preScore)}  | ${exhCol}`
  );
}
console.log(
  `\n  deterministic pass -> zero edge-edge crossings: ` +
  `${rows.filter((r) => r.preScore.edgeEdge === 0).length}/${rows.length}` +
  `   with pipeline search: ${rows.filter((r) => r.exh.score.edgeEdge === 0).length}/${rows.length}`
);
if (emit) console.log(`  optimized syntax written to proto/out/`);
