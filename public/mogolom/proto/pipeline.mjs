// The full deterministic search pipeline, shared by bench.mjs and the web
// bundle so the two can't drift apart:
//
//   1. multi-root scan — preprocess from every candidate root, apply geometric
//      feedback re-emission to each (raw base scores misrank roots: ordering-
//      induced crossings hide structurally perfect bases), keep the best.
//   2. orientation search — exhaustive over non-tree orientations when 2^k is
//      small (on the raw base, whose tree/non-tree split is intact), greedy
//      descent otherwise.
//   3. polish — alternate greedy descent and feedback re-emission until a
//      joint fixpoint (flips change geometry, which re-emission then exploits).
//   4. fallback — polish the default-root/original path too and keep the
//      winner, so no input regresses versus a simpler pipeline.
//
// Early-exits everywhere at 0 crossings / 0 through-box.

import { scoreErd, geometricReorder } from './scorer.mjs';
import {
  preprocess,
  exhaustiveNonTree,
  greedyDescent,
  betterScore,
} from './preprocess.mjs';

const perfect = (s) => s.edgeEdge === 0 && s.edgeNode === 0;

export async function feedbackToFixpoint(model, opts = {}, budget = 4) {
  let variant = model;
  let score = scoreErd(variant);
  let evals = 1;
  for (let i = 0; i < budget && !perfect(score); i++) {
    const next = geometricReorder(variant);
    const s = scoreErd(next);
    evals++;
    if (!betterScore(s, score)) break;
    variant = next;
    score = s;
  }
  return { variant, score, evals };
}

// Preprocess from every candidate root, feedback each, return the best —
// both the feedback variant and the raw base (whose tree/non-tree relationship
// split exhaustiveNonTree depends on).
export async function bestRoot(parsed, opts = {}) {
  const maxRoots = opts.maxRoots ?? 64;
  let candidates = parsed.firstMention;
  if (candidates.length > maxRoots) {
    const deg = new Map(candidates.map((n) => [n, 0]));
    for (const r of parsed.relationships) {
      deg.set(r.entityA, deg.get(r.entityA) + 1);
      deg.set(r.entityB, deg.get(r.entityB) + 1);
    }
    const sorted = [...candidates].sort((a, b) => deg.get(b) - deg.get(a));
    candidates = Array.from(
      { length: maxRoots },
      (_, i) => sorted[Math.floor((i * sorted.length) / maxRoots)]
    );
  }

  let best = null;
  let evals = 0;
  for (const root of candidates) {
    const rawPre = preprocess(parsed, { root });
    const fb = await feedbackToFixpoint(rawPre, opts);
    evals += fb.evals;
    if (!best || betterScore(fb.score, best.score)) {
      best = { ...fb, rawPre, root };
    }
    if (perfect(best.score)) break;
    opts.onProgress?.({ evals, best: best.score });
    // Yield per root so the UI repaints and Stop registers during the scan —
    // on large diagrams this phase dominates the runtime.
    await new Promise((r) => setTimeout(r, 0));
    if (opts.isCancelled?.()) break;
  }
  return { ...best, evals };
}

// Alternate descent and feedback until neither improves.
async function polish(model, opts, cycles = 3) {
  let best = { variant: model, score: scoreErd(model), evals: 1 };
  for (let i = 0; i < cycles && !perfect(best.score); i++) {
    const d = await greedyDescent(best.variant, scoreErd, null, opts);
    const f = await feedbackToFixpoint(d.variant, opts);
    const cand = betterScore(f.score, d.score) ? f : d;
    const evals = best.evals + d.evals + f.evals;
    if (betterScore(cand.score, best.score)) {
      best = { variant: cand.variant, score: cand.score, evals };
    } else {
      best.evals = evals;
      break;
    }
  }
  return best;
}

export async function search(parsed, opts = {}) {
  const maxK = opts.maxExhaustiveK ?? 11;
  const cancelled = () => opts.isCancelled?.() ?? false;
  const pre = preprocess(parsed);
  let evals = 0;

  const rootSel = await bestRoot(parsed, opts);
  evals += rootSel.evals;

  let seed = rootSel.variant;
  let seedScore = rootSel.score;
  let method = 'multi-root + feedback';
  if (!perfect(rootSel.score) && !cancelled() && pre.nonTreeCount <= maxK) {
    const ex = await exhaustiveNonTree(rootSel.rawPre, scoreErd, opts);
    evals += ex.evals;
    if (betterScore(ex.score, rootSel.score)) {
      seed = ex.variant;
      seedScore = ex.score;
    }
    method += ' + exhaustive';
  }

  let best = { variant: seed, score: seedScore, evals: 0 };
  if (!perfect(seedScore) && !cancelled()) {
    best = await polish(seed, opts);
    method += ' + descent';
  }
  evals += best.evals;

  // Fallback path: the pre-multi-root pipeline (default root vs original).
  if (!perfect(best.score) && !cancelled()) {
    const origScore = scoreErd(parsed);
    evals++;
    const fallbackStart = betterScore(origScore, scoreErd(pre)) ? parsed : pre;
    evals++;
    const fb = await polish(fallbackStart, opts);
    evals += fb.evals;
    if (betterScore(fb.score, best.score)) best = fb;
  }

  return {
    variant: best.variant,
    score: best.score,
    evals,
    method,
    nonTreeCount: pre.nonTreeCount,
    root: rootSel.root,
  };
}
