# Transplanting the proto engine into the original ERD app

The proto's deterministic pipeline (`js/erd-proto.bundle.js`, built from
`proto/`) replaces the original app's render-and-guess loop outright. Nothing
in the old algorithm files is worth porting line-by-line — the architecture
they implement (render every candidate through mermaid, measure the SVG,
mutate randomly) is what the proto made obsolete.

Files that get **deleted** at the end of this plan:

| file | lines | replaced by |
|------|-------|-------------|
| `js/erd-optimizer.js`      | ~450 | `ErdProto.optimize()` + thin page glue |
| `js/erd-svg-analyzer.js`   | ~515 | replica scoring (Tier 1), measured analyzer (Tier 2) |
| `js/erd-syntax-swapper.js` | ~200 | `ErdProto.parseErd` / pipeline moves |

`erd-example-manager.js` survives in reduced form or merges into the bundle
(Tier 3 decision). The flowchart side (`index.html`, `js/mogolom.js`, …) is
untouched.

---

## Tier 1 — engine swap (hour or two, low risk)

Goal: `erd.html` keeps its exact UI, but Optimize runs the deterministic
pipeline instead of the 2000-render loop.

1. Load the bundle in `erd.html`:
   `<script src="js/erd-proto.bundle.js"></script>` (before the page script).
2. Rewire `startOptimization()`:
   - call `ErdProto.optimize(codeEditor.value, { yieldEvery: 20, isCancelled,
     onProgress })`;
   - `onProgress({ evals, best })` feeds the existing stat cards — map
     `evals` -> "Iterations", `best.edgeEdge` / `best.edgeNode` ->
     "Edge-Edge" / "Edge-Node", weighted total -> "Score";
   - on completion write `result.bestCode` into the editor, render once with
     mermaid, show final stats. "Improvements Found" either retires or shows
     descent-improvement count if we care to thread it through.
3. Stop button: set the flag read by `isCancelled` (same pattern as erd2).
4. Examples: keep the old dropdown but source entries from
   `ErdProto.examples` merged with the two originals (see Tier 3).
5. Interim display: counts shown are replica *predictions* — label them
   "(predicted)" exactly as erd2 does, so nothing lies while Tier 2 lands.
   The old intersection dots are dropped in this tier (they relied on the
   buggy analyzer; Tier 2 restores them properly).
6. Delete nothing yet — leave old scripts unloaded but on disk until Tier 2
   confirms nothing else references them.

Acceptance: optimizing `mogolom-example` on `erd.html` gives 3 -> 0 EE in
under a second, same numbers as `node bench.mjs`; Stop works; editing the
textarea still live-renders.

## Tier 2 — measured-SVG layer (~a day, the only new code)

Goal: restore the red/blue intersection dots and show *measured* counts from
the rendered SVG, replacing predictions — which also turns every run into a
live verification of the replica.

1. New `proto/svg-measure.mjs` (exported through the bundle):
   - sample every `path.er.relationshipLine` via `getTotalLength()` /
     `getPointAtLength()` every ~5px into polylines — no hand-rolled path
     parsing (that was the `issues.md` bug source);
   - entity boxes via `getBBox()` + `getCTM()` — no regex transform parsing;
   - segment-pair intersection for edge-edge, polyline-vs-rect for
     edge-node, with the same shared-endpoint epsilon rules as
     `scorer.mjs` so measured and predicted counts are comparable;
   - return intersection points in rendered-SVG coordinates for markers.
2. Golden fixtures first: hand-crafted SVG snippets with known counts
   (two lines crossing once; a curve grazing a box; two edges sharing an
   endpoint that must count zero) driven by the existing puppeteer harness
   (`test-web.mjs` pattern). Write these before the implementation.
3. Page integration (`erd.html`, and erd2 if we keep it):
   - after each render, run the measured analyzer, draw dots, display
     "measured X / predicted Y";
   - if measured != predicted, surface it (small warning badge) — that's
     replica drift or a real analyzer gap, either way we want to see it.
4. Retire `erd-svg-analyzer.js` and the old marker code in
   `erd-optimizer.js`; delete `erd-optimizer.js` and
   `erd-syntax-swapper.js` once the page script no longer references them.

Acceptance: golden fixtures pass; on the corpus, measured == predicted for
edge-edge on every diagram (edge-node may differ slightly — box sizes are
approximated in the replica; document observed deltas in README results).

## Tier 3 — decisions, not code

- **One page or two?** Recommendation: keep both. `erd.html` = single-pane
  working view; `erd2.html` = side-by-side before/after compare view. They
  share the bundle and, after Tier 2, the measured analyzer.
- **Examples**: fold `erd-example-manager.js`'s two examples into
  `proto/corpus/` as `.mmd` files (they're already duplicated as corpus
  entries — reconcile and keep one source of truth), then delete the manager
  or reduce it to a dropdown-builder over `ErdProto.examples`.
- **"Keep polishing" button**: the deterministic pipeline *finishes* instead
  of grinding forever — a UX change, not a regression. Extra descent rounds
  from perturbed starts could back an optional button; don't build it until
  someone misses it.
- **Docs**: update `mogolom.md` (project README) to describe the ERD path's
  new architecture; fold the relevant parts of `proto/README.md` in; mark
  `issues.md`'s analyzer bug as resolved-by-replacement.

## Sequencing

Tier 1 ships alone (trivially reversible — one script tag and one function
swapped). Tier 2 lands behind its fixtures. Tier 3 cleanups ride along with
whichever tier touches the file last. After Tier 2, `git rm` the three
retired files in the same commit that removes their script tags, so the
delete is atomic and bisectable.
