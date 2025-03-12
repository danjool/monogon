// Functions for scrambling edge positions
function scrambleEdges(tree, problematicEdges, longestPaths = []) {
  if (tree.edges.length <= 1) return tree;

  const shuffleCount = 1 + Math.floor(Math.random() * 3);
  
  // Combine problematic edges and longest paths with different priorities
  const priorityEdges = [...problematicEdges];
  
  // Add longest paths with lower priority (by adding them fewer times)
  if (longestPaths.length) {
    longestPaths.forEach(path => {
      if (Math.random() < 0.7) { // 70% chance to include each long path
        priorityEdges.push(path);
      }
    });
  }
  
  for (let i = 0; i < shuffleCount; i++) {
    if (priorityEdges.length && Math.random() < 0.6) {
      // Prioritize problematic or long edges
      const priorityEdge = priorityEdges[Math.floor(Math.random() * priorityEdges.length)];
      const matchingEdges = tree.edges.filter(e => e.raw.includes(priorityEdge));
      
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