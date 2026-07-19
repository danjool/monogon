# MOGOLOM proto — headless dagre scorer + deterministic ERD optimization

> Migration plan for replacing the original `erd.html` engine with this
> pipeline: see [TRANSPLANT.md](./TRANSPLANT.md).

Prototype replacing the browser render-and-guess loop for ER diagrams with:

1. **Headless scoring** (`scorer.mjs`): rebuilds the exact dagre graph mermaid
   10.8.0's `erRenderer` builds (`dagre-d3-es@7.0.10`, multigraph, rankdir TB,
   nodesep/edgesep/ranksep 100, edges `entityA -> entityB` in source order),
   runs the same layout, and counts edge-edge / edge-node crossings on the
   resulting polylines. No browser, no SVG parsing. Dagre's rank and ordering
   phases are size-independent, so approximated entity box sizes don't affect
   edge-edge counts.
2. **Spanning-tree preprocessing** (`preprocess.mjs`): BFS the entity graph,
   orient all relationships shallow->deep (reversal is semantically free —
   cardinalities are mirrored, labels untouched), emit tree relationships in
   BFS order. Only the `m - n + 1` non-tree relationships can still cross.
3. **Multi-root scan** (`pipeline.mjs`): the BFS root fixes the entire rank
   structure and is the strongest lever by far. Every entity is tried as root
   (degree-sorted spread beyond 64), each base gets feedback re-emission (see
   4) before ranking — raw base scores misrank roots badly (a 6x6 grid's true
   best root scored 13 raw / 0 after feedback, while the raw-best root's 5 was
   structural and unfixable).
4. **Geometric feedback re-emission** (`geometricReorder` in `scorer.mjs`):
   lay out the model, re-emit relationships sorted by their endpoints'
   computed (y, x) positions, repeat while improving. Dagre's initial in-rank
   ordering follows edge insertion order, so aligning it with the previous
   geometry lets the ordering phase settle — ordering-induced crossings
   vanish (measured 13 -> 0 in one round).
5. **Orientation search**: exhaustive over `2^k` non-tree orientations when
   `k` is small; then descent/feedback alternation to a joint fixpoint, plus a
   fallback polish from the default/original base so nothing regresses.

Lever findings, measured: entity *declaration order* (dagre node insertion) is
dead — 500 random permutations never improved a layout; barycenter converges
identically. Relationship *emission order* (dagre edge insertion) is decisive —
identical orientations scored 0 in geometric order vs 13-28 across random
orders. Naive sort keys (BFS source order etc.) do nothing; the order must
match the layout's own geometry, hence the feedback loop.

## Run

```
npm install
node bench.mjs          # score corpus/: original vs preprocessed vs searched
node bench.mjs --emit   # also write optimized syntax to out/
npm run build:web       # bundle web-entry.mjs -> ../js/erd-proto.bundle.js
npm run test:web        # end-to-end browser test of ../erd2.html (needs a
                        #   server on :8931 and /usr/bin/google-chrome)
```

## Web UI

`../erd2.html` is a try-it page for these algorithms: paste an erDiagram (or
pick a bundled corpus example), hit Optimize, and see original vs optimized
rendered side by side by real mermaid 10.8.0 with predicted crossing counts,
method (exhaustive vs greedy), eval count, and timing. Progress streams during
long runs; Stop keeps the best found so far; Copy grabs the optimized syntax.

The page loads `js/erd-proto.bundle.js`, a committed build artifact — re-run
`npm run build:web` after touching any `.mjs` here or the corpus examples.

## Results (2026-07-19)

| diagram             | n  | m   | original EE/EN | + full pipeline      | certified floor |
|---------------------|----|-----|----------------|----------------------|-----------------|
| library             | 6  | 5   | 0 / 0          | 0 / 0                | —               |
| university          | 4  | 4   | 0 / 0          | 0 / 0                | —               |
| mogolom-example     | 11 | 15  | 3 / 2          | **0 / 0** (0.1s)     | —               |
| mogolom-bonkers     | 43 | 66  | 71 / 14        | 23 / 4 (25s)         | —               |
| planar-grid-4x4     | 16 | 24  | 6 / 0          | **0 / 0** (0.2s)     | 0               |
| planar-grid-6x6     | 36 | 60  | 61 / 9         | **0 / 0** (0.5s)     | 0               |
| planar-grid-8x8-diag| 64 | 126 | 256 / 18       | **0 / 0** (24s)      | ≤14 (beaten)    |

EE = edge-edge crossings, EN = edge-node (line through an unrelated entity box).

The planar corpus comes from `gen-planar.mjs` (seeded): it emits a scrambled
test input plus a `.ideal.mmd` whose replica score is a *certified-achievable*
floor recorded in a `%% floor:` comment — an upper bound on the optimum, so
search can legitimately beat it (8x8-diag: search found 0 vs the ideal's 14).

## Caveats / next steps

- Mermaid draws the final path as a basis curve through dagre's points; the
  smoothed curve can differ from the polyline by an occasional near-tangent
  crossing. Needs a one-shot verification render (puppeteer) comparing replica
  counts against real SVG counts across the corpus.
- Entity box sizes are approximated from text length; affects edge-node counts
  and coordinates only, not edge-edge counts.
- `mogolom-bonkers` (23 EE / 4 EN) is the floor of this search, not of the
  diagram (likely non-planar, true optimum unknown); note the lexicographic
  score prefers 23/4 over the earlier 28/0 — crossings dominate by design.
- Parser covers symbol notation (`--` and `..`), quoted/unquoted labels, and
  attribute blocks; text notation (`one to many`) not yet.
- Config replicated from mermaid v10.8.0; re-check `erRenderer.js` on any
  mermaid upgrade (a corpus verification test would catch drift automatically).
