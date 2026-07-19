// Browser bundle entry point. Built by `npm run build:web` (esbuild) into
// ../js/erd-proto.bundle.js as an IIFE exposing window.ErdProto.

import { parseErd, serializeErd } from './parse-erd.mjs';
import { scoreErd, geometricReorder } from './scorer.mjs';
import { preprocess, exhaustiveNonTree, greedyDescent } from './preprocess.mjs';
import { search, bestRoot, feedbackToFixpoint } from './pipeline.mjs';

import mogolomExample from './corpus/mogolom-example.mmd';
import mogolomBonkers from './corpus/mogolom-bonkers.mmd';
import library from './corpus/library.mmd';
import university from './corpus/university.mmd';
import planarGrid from './corpus/planar-grid-6x6.mmd';
import planarGrid8 from './corpus/planar-grid-8x8-diag.mmd';

export { parseErd, serializeErd, scoreErd, geometricReorder, preprocess, exhaustiveNonTree, greedyDescent, search, bestRoot, feedbackToFixpoint };

export const examples = [
  { id: 'mogolom-example', name: 'Mogolom Example', code: mogolomExample },
  { id: 'mogolom-bonkers', name: 'Mogolom Bonkers', code: mogolomBonkers },
  { id: 'library', name: 'Library System', code: library },
  { id: 'university', name: 'University System', code: university },
  { id: 'planar-grid', name: 'Planar Grid 6x6 (floor: 0)', code: planarGrid },
  { id: 'planar-grid-8x8', name: 'Planar Grid 8x8 diag (floor: 0, ~30s)', code: planarGrid8 },
];

// One-call pipeline: parse -> score original -> spanning-tree preprocess ->
// orientation search (exhaustive when 2^k is small, greedy descent otherwise).
// opts: { maxExhaustiveK, onProgress, isCancelled, yieldEvery }
export async function optimize(code, opts = {}) {
  const t0 = performance.now();
  const parsed = parseErd(code);
  const originalScore = scoreErd(parsed);
  const pre = preprocess(parsed);
  const preScore = scoreErd(pre);

  const result = await search(parsed, opts);

  return {
    parsed,
    originalScore,
    preScore,
    nonTreeCount: result.nonTreeCount,
    method: result.method,
    evals: result.evals,
    bestScore: result.score,
    bestCode: serializeErd(result.variant),
    unparsedLines: parsed.other,
    ms: performance.now() - t0,
  };
}
