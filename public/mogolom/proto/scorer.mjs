// Headless dagre scorer: replicates how mermaid 10.8.0's erRenderer builds its
// dagre graph (multigraph, directed, rankdir TB, nodesep/edgesep/ranksep 100,
// margins 20, edges inserted entityA -> entityB in source order, edge name
// (entityA + role + entityB) with whitespace stripped), runs the same layout,
// and counts crossings on the resulting polylines.
//
// Node boxes are approximated from text since there is no SVG to measure; dagre's
// rank and ordering phases are purely combinatorial, so box sizes do not affect
// edge-edge crossing counts — only coordinates (and thus edge-node checks).

import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { layout as dagreLayout } from 'dagre-d3-es/src/dagre/index.js';

const MIN_ENTITY_WIDTH = 100; // mermaid er.minEntityWidth
const MIN_ENTITY_HEIGHT = 75; // mermaid er.minEntityHeight
const CHAR_WIDTH = 7.5;
const ROW_HEIGHT = 30;

function entityBox(name, attributes) {
  const attrLens = attributes.map((a) => a.length + 6); // attrs render as type|name|keys columns
  const width = Math.max(MIN_ENTITY_WIDTH, (Math.max(name.length, ...attrLens, 0) * CHAR_WIDTH) + 30);
  const height = Math.max(MIN_ENTITY_HEIGHT, ROW_HEIGHT + attributes.length * ROW_HEIGHT);
  return { width, height };
}

function edgeName(rel) {
  return (rel.entityA + rel.label + rel.entityB).replace(/\s/g, '');
}

export function layoutErd(parsed, { rankdir = 'TB' } = {}) {
  const g = new graphlib.Graph({ multigraph: true, directed: true, compound: false })
    .setGraph({ rankdir, marginx: 20, marginy: 20, nodesep: 100, edgesep: 100, ranksep: 100 })
    .setDefaultEdgeLabel(() => ({}));

  for (const name of parsed.firstMention) {
    const attrs = parsed.attributeBlocks?.get(name) ?? [];
    g.setNode(name, { ...entityBox(name, attrs) });
  }
  for (const rel of parsed.relationships) {
    g.setEdge(rel.entityA, rel.entityB, { relationship: rel }, edgeName(rel));
  }

  dagreLayout(g);
  return g;
}

// --- geometry ---------------------------------------------------------------

const EPS = 1e-9;

// Proper segment intersection (strictly interior on both segments).
function segIntersect(a, b, c, d) {
  const denom = (d.y - c.y) * (b.x - a.x) - (d.x - c.x) * (b.y - a.y);
  if (Math.abs(denom) < EPS) return null;
  const ua = ((d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x)) / denom;
  const ub = ((b.x - a.x) * (a.y - c.y) - (b.y - a.y) * (a.x - c.x)) / denom;
  if (ua <= EPS || ua >= 1 - EPS || ub <= EPS || ub >= 1 - EPS) return null;
  return { x: a.x + ua * (b.x - a.x), y: a.y + ua * (b.y - a.y) };
}

function pointInRect(p, rect, pad = 0) {
  return (
    p.x >= rect.x - rect.width / 2 - pad &&
    p.x <= rect.x + rect.width / 2 + pad &&
    p.y >= rect.y - rect.height / 2 - pad &&
    p.y <= rect.y + rect.height / 2 + pad
  );
}

function segments(points) {
  const out = [];
  for (let i = 0; i + 1 < points.length; i++) out.push([points[i], points[i + 1]]);
  return out;
}

export function scoreLayout(g) {
  const edges = g.edges().map((e) => ({
    key: e,
    v: e.v,
    w: e.w,
    points: g.edge(e).points,
  }));

  // Edge-edge: count each crossing pair once. Intersections inside a shared
  // endpoint entity's (slightly inflated) box are anchor artifacts, not crossings.
  let edgeEdge = 0;
  const crossingPairs = [];
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];
      const shared = [e1.v, e1.w].filter((n) => n === e2.v || n === e2.w);
      let crossed = false;
      outer: for (const [a, b] of segments(e1.points)) {
        for (const [c, d] of segments(e2.points)) {
          const p = segIntersect(a, b, c, d);
          if (p && !shared.some((n) => pointInRect(p, g.node(n), 4))) {
            crossed = true;
            break outer;
          }
        }
      }
      if (crossed) {
        edgeEdge++;
        crossingPairs.push([e1.key, e2.key]);
      }
    }
  }

  // Edge-node: an edge polyline passing through an entity box it doesn't connect.
  let edgeNode = 0;
  for (const e of edges) {
    for (const n of g.nodes()) {
      if (n === e.v || n === e.w) continue;
      const rect = g.node(n);
      const hit = segments(e.points).some(([a, b]) => {
        if (pointInRect(a, rect) || pointInRect(b, rect)) return true;
        const corners = [
          { x: rect.x - rect.width / 2, y: rect.y - rect.height / 2 },
          { x: rect.x + rect.width / 2, y: rect.y - rect.height / 2 },
          { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
          { x: rect.x - rect.width / 2, y: rect.y + rect.height / 2 },
        ];
        for (let i = 0; i < 4; i++) {
          if (segIntersect(a, b, corners[i], corners[(i + 1) % 4])) return true;
        }
        return false;
      });
      if (hit) edgeNode++;
    }
  }

  const { width, height } = g.graph();
  return { edgeEdge, edgeNode, crossingPairs, width, height };
}

export function scoreErd(parsed, opts) {
  return scoreLayout(layoutErd(parsed, opts));
}

// Re-emit relationships sorted by their endpoints' positions in the model's
// own layout. Dagre's initial in-rank ordering follows edge insertion order,
// so aligning that order with the previous geometry lets the ordering phase
// settle into it — crossings that were purely ordering-induced disappear
// (measured: a 6x6 grid base dropped 13 -> 0 in one round). Orientation-
// structural crossings are untouched.
export function geometricReorder(parsed, opts) {
  const g = layoutErd(parsed, opts);
  const pos = (n) => g.node(n);
  const relationships = [...parsed.relationships].sort((a, b) => {
    const A = pos(a.entityA), B = pos(a.entityB), C = pos(b.entityA), D = pos(b.entityB);
    return (A.y - C.y) || (A.x - C.x) || (B.y - D.y) || (B.x - D.x);
  });

  const firstMention = [];
  const seen = new Set();
  const mention = (n) => {
    if (!seen.has(n)) { seen.add(n); firstMention.push(n); }
  };
  for (const r of relationships) { mention(r.entityA); mention(r.entityB); }
  for (const n of parsed.firstMention) mention(n);

  return { ...parsed, relationships, firstMention };
}
