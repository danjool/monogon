// Generate planar ERD benchmarks with a certified crossing floor.
//
// Emits a rows x cols grid graph (optionally with one down-right diagonal per
// cell, still planar) as an erDiagram, twice:
//   <name>.ideal.mmd — row-major emission, everything oriented down/right.
//     Oriented this way the grid is upward planar (ranks are the
//     anti-diagonals), so dagre *can* draw it crossing-free; whatever the
//     replica scores for this file is a certified-achievable floor.
//   <name>.mmd — the test input: seeded shuffle of relationship order and
//     orientations. Header comments record the floor and the generator command
//     so bench.mjs can report gap-to-floor.
//
// Usage: node gen-planar.mjs <rows> <cols> [--diag p] [--seed n] [--name str]

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseErd, serializeErd, reverseRelationship } from './parse-erd.mjs';
import { scoreErd } from './scorer.mjs';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const args = process.argv.slice(2);
const rows = parseInt(args[0] ?? '6', 10);
const cols = parseInt(args[1] ?? '6', 10);
const flag = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : dflt;
};
const diagP = parseFloat(flag('diag', '0'));
const seed = parseInt(flag('seed', '42'), 10);
const name = flag('name', `planar-grid-${rows}x${cols}${diagP > 0 ? '-diag' : ''}`);

const rand = mulberry32(seed);
const CARDS = [['||', '||'], ['||', 'o{'], ['||', '|{'], ['|o', '||']];
const id = (r, c) => `N${r}_${c}`;

// Ideal emission: row-major, oriented down/right (a DAG whose longest-path
// ranks are the anti-diagonals r+c).
const relationships = [];
const addRel = (a, b) => {
  const [cardA, cardB] = CARDS[Math.floor(rand() * CARDS.length)];
  relationships.push({ entityA: a, cardA, lineType: '--', cardB, entityB: b, label: 'r' });
};
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    if (c + 1 < cols) addRel(id(r, c), id(r, c + 1));
    if (r + 1 < rows) addRel(id(r, c), id(r + 1, c));
    if (r + 1 < rows && c + 1 < cols && rand() < diagP) addRel(id(r, c), id(r + 1, c + 1));
  }
}

const mentionOrder = (rels) => {
  const seen = new Set();
  const order = [];
  for (const r of rels) {
    for (const n of [r.entityA, r.entityB]) {
      if (!seen.has(n)) { seen.add(n); order.push(n); }
    }
  }
  return order;
};

const ideal = {
  relationships,
  attributeBlocks: new Map(),
  firstMention: mentionOrder(relationships),
  other: [],
};
const floor = scoreErd(ideal);

// Scrambled test input: shuffle order, flip orientations at random.
const scrambledRels = relationships
  .map((r) => (rand() < 0.5 ? reverseRelationship(r) : r))
  .map((r) => ({ r, k: rand() }))
  .sort((a, b) => a.k - b.k)
  .map(({ r }) => r);
const scrambled = {
  relationships: scrambledRels,
  attributeBlocks: new Map(),
  firstMention: mentionOrder(scrambledRels),
  other: [],
};
const scrambledScore = scoreErd(scrambled);

const header =
  `    %% generated: node gen-planar.mjs ${rows} ${cols} --diag ${diagP} --seed ${seed}\n` +
  `    %% planar: true\n` +
  `    %% floor: ${floor.edgeEdge}`;

const outDir = join(import.meta.dirname, 'corpus');
writeFileSync(join(outDir, `${name}.ideal.mmd`), serializeErd(ideal) + '\n');
writeFileSync(
  join(outDir, `${name}.mmd`),
  serializeErd(scrambled).replace('erDiagram', 'erDiagram\n' + header) + '\n'
);

// Round-trip sanity: the emitted file must parse back to the same counts.
const back = parseErd(serializeErd(scrambled));
if (back.relationships.length !== relationships.length) {
  throw new Error('round-trip lost relationships');
}

console.log(`${name}: ${ideal.firstMention.length} entities, ${relationships.length} relationships`);
console.log(`  ideal (certified floor): EE ${floor.edgeEdge}  EN ${floor.edgeNode}`);
console.log(`  scrambled test input:    EE ${scrambledScore.edgeEdge}  EN ${scrambledScore.edgeNode}`);
