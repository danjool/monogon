// Deterministic spanning-tree preprocessing.
//
// Since relationship reversal is semantically free (labels read direction-free),
// edge orientation is ours to choose. Strategy:
//   1. Build the undirected entity graph and BFS from the highest-degree entity.
//   2. Orient every relationship shallow -> deep (tree edges parent -> child),
//      so ranks flow one way and back-edges — dagre's main source of tangles —
//      are eliminated. Equal-depth edges orient by BFS discovery order.
//   3. Emit tree relationships in BFS discovery order first (making dagre's node
//      insertion order the BFS order), then the leftover non-tree relationships.
// A tree lays out with zero crossings, so only the m - n + 1 non-tree
// relationships can still cross.

import { reverseRelationship } from './parse-erd.mjs';

export function preprocess(parsed, { root } = {}) {
  const rels = parsed.relationships;

  // Undirected adjacency + degree, in first-mention order for determinism.
  const adj = new Map(parsed.firstMention.map((n) => [n, []]));
  rels.forEach((r, i) => {
    adj.get(r.entityA).push({ other: r.entityB, relIndex: i });
    adj.get(r.entityB).push({ other: r.entityA, relIndex: i });
  });

  const depth = new Map();
  const bfsOrder = new Map(); // entity -> visit sequence number
  const treeRelIndices = [];
  let seq = 0;

  const roots = [...adj.keys()].sort(
    (a, b) => adj.get(b).length - adj.get(a).length
  );
  // Explicit root override: BFS this component from the given entity instead
  // of the highest-degree one (root choice sets the whole rank structure).
  if (root && adj.has(root)) roots.unshift(root);
  for (const root of roots) {
    if (depth.has(root)) continue; // next connected component
    depth.set(root, 0);
    bfsOrder.set(root, seq++);
    const queue = [root];
    while (queue.length) {
      const u = queue.shift();
      for (const { other, relIndex } of adj.get(u)) {
        if (depth.has(other)) continue;
        depth.set(other, depth.get(u) + 1);
        bfsOrder.set(other, seq++);
        treeRelIndices.push(relIndex);
        queue.push(other);
      }
    }
  }

  const treeSet = new Set(treeRelIndices);

  // Orient shallow -> deep; ties by BFS discovery order.
  const orient = (r) => {
    const dA = depth.get(r.entityA);
    const dB = depth.get(r.entityB);
    if (dA > dB || (dA === dB && bfsOrder.get(r.entityA) > bfsOrder.get(r.entityB)))
      return reverseRelationship(r);
    return r;
  };

  const tree = treeRelIndices.map((i) => orient(rels[i]));
  const nonTree = rels
    .map((r, i) => ({ r, i }))
    .filter(({ i }) => !treeSet.has(i))
    .map(({ r }) => orient(r))
    .sort(
      (a, b) =>
        depth.get(a.entityA) - depth.get(b.entityA) ||
        bfsOrder.get(a.entityA) - bfsOrder.get(b.entityA)
    );

  const relationships = [...tree, ...nonTree];

  // Recompute first-mention order from the new relationship order, then any
  // relationship-less entities from the original order.
  const firstMention = [];
  const seen = new Set();
  const mention = (n) => {
    if (!seen.has(n)) {
      seen.add(n);
      firstMention.push(n);
    }
  };
  for (const r of relationships) {
    mention(r.entityA);
    mention(r.entityB);
  }
  for (const n of parsed.firstMention) mention(n);

  return {
    relationships,
    attributeBlocks: parsed.attributeBlocks,
    firstMention,
    other: parsed.other,
    nonTreeCount: nonTree.length,
  };
}

export const betterScore = (a, b) =>
  a.edgeEdge < b.edgeEdge || (a.edgeEdge === b.edgeEdge && a.edgeNode < b.edgeNode);
const better = betterScore;

// Both search functions are async so a browser UI can stay responsive: every
// `yieldEvery` evaluations they report progress, yield to the event loop, and
// check for cancellation. Defaults keep Node bench behavior effectively sync.
const tick = () => new Promise((r) => setTimeout(r, 0));

async function checkpoint(evals, score, opts) {
  if (evals % (opts.yieldEvery ?? 50) !== 0) return false;
  opts.onProgress?.({ evals, best: score });
  await tick();
  return opts.isCancelled?.() ?? false;
}

// Deterministic greedy descent over orientation flips: reverse one
// relationship at a time (tree edges included), keep any improvement, repeat
// until a pass yields none. Starts from whichever of {preprocessed, original}
// scores better. (Entity-declaration-order moves were tried and removed:
// dagre's barycenter sweeps converge to the same in-rank order regardless of
// insertion order — 500 random permutations never beat the incumbent.)
export async function greedyDescent(preprocessed, scoreFn, originalParsed = null, opts = {}) {
  let current = preprocessed;
  let score = scoreFn(current);
  let evals = 1;

  if (originalParsed) {
    const origScore = scoreFn(originalParsed);
    evals++;
    if (better(origScore, score)) {
      current = { ...originalParsed, nonTreeCount: preprocessed.nonTreeCount };
      score = origScore;
    }
  }

  const tryVariant = (variant) => {
    const s = scoreFn(variant);
    if (better(s, score)) {
      current = variant;
      score = s;
      return true;
    }
    return false;
  };

  let improved = true;
  let cancelled = false;
  while (improved && !cancelled && score.edgeEdge + score.edgeNode > 0) {
    improved = false;
    for (let i = 0; i < current.relationships.length && !cancelled; i++) {
      const relationships = current.relationships.map((r, j) =>
        j === i ? reverseRelationship(r) : r
      );
      improved = tryVariant({ ...current, relationships }) || improved;
      evals++;
      cancelled = await checkpoint(evals, score, opts);
    }
  }
  return { variant: current, score, evals };
}

// Exhaustive search over the 2^k orientation choices of the non-tree
// relationships (tree orientation and emission order fixed by preprocessing).
// Returns the best-scoring variant. Caller guards k.
export async function exhaustiveNonTree(preprocessed, scoreFn, opts = {}) {
  const k = preprocessed.nonTreeCount;
  const treeCount = preprocessed.relationships.length - k;
  let best = null;
  let evals = 0;

  for (let mask = 0; mask < 1 << k; mask++) {
    const relationships = preprocessed.relationships.map((r, i) => {
      const nt = i - treeCount;
      return nt >= 0 && (mask >> nt) & 1 ? reverseRelationship(r) : r;
    });
    const variant = { ...preprocessed, relationships };
    const score = scoreFn(variant);
    evals++;
    if (!best || better(score, best.score)) {
      best = { variant, score, mask };
    }
    if (best.score.edgeEdge === 0 && best.score.edgeNode === 0) break;
    if (await checkpoint(evals, best.score, opts)) break;
  }
  return { ...best, evals };
}
