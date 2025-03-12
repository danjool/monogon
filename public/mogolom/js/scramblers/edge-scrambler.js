// Functions for scrambling edge positions
function scrambleEdges(tree, problematicEdges) {
  if (tree.edges.length <= 1) return tree;

  const shuffleCount = 1 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < shuffleCount; i++) {
    if (problematicEdges.length && Math.random() < 0.6) {
      // Prioritize problematic edges
      const problemEdge = problematicEdges[Math.floor(Math.random() * problematicEdges.length)];
      const matchingEdges = tree.edges.filter(e => e.raw.includes(problemEdge));
      
      if (matchingEdges.length) {
        const edge1 = matchingEdges[Math.floor(Math.random() * matchingEdges.length)];
        let edge2;
        do {
          edge2 = tree.edges[Math.floor(Math.random() * tree.edges.length)];
        } while (edge2 === edge1);
        
        const idx1 = tree.edges.indexOf(edge1);
        const idx2 = tree.edges.indexOf(edge2);
        [tree.edges[idx1], tree.edges[idx2]] = [tree.edges[idx2], tree.edges[idx1]];
      }
    } else {
      // Random edge swap
      const idx1 = Math.floor(Math.random() * tree.edges.length);
      let idx2;
      do {
        idx2 = Math.floor(Math.random() * tree.edges.length);
      } while (idx2 === idx1);
      
      [tree.edges[idx1], tree.edges[idx2]] = [tree.edges[idx2], tree.edges[idx1]];
    }
  }

  return tree;
}

window.EdgeScrambler = {
  scrambleEdges
}; 