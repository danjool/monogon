// Handles legal tree manipulations while preserving structure
const scrambleFlow = (tree, problematicEdges = []) => {
    console.log('Scrambling flow:', JSON.stringify(tree, null, 2));
    console.log('Problematic edges:', problematicEdges);
  // Helper to shuffle array elements
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Helper to check if a node is safe to shuffle
  const isSafeToShuffle = (node) => {
    // Don't shuffle nodes with special characters or multiline content
    return !node.hasSpecialChars && !node.raw.includes('\n');
  };

  // Deep clone tree to avoid mutations
  const newTree = JSON.parse(JSON.stringify(tree));
  
  // Shuffle main graph edges (100% chance)
  if (newTree.edges.length > 1) {
    const shuffleCount = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < shuffleCount; i++) {
      // Prioritize problematic edges (60% chance)
      if (problematicEdges.length && Math.random() < 0.6) {
        const problemEdge = problematicEdges[Math.floor(Math.random() * problematicEdges.length)];
        const matchingEdges = newTree.edges.filter(e => e.raw.includes(problemEdge));
        
        if (matchingEdges.length) {
          const edge1 = matchingEdges[Math.floor(Math.random() * matchingEdges.length)];
          let edge2;
          do {
            edge2 = newTree.edges[Math.floor(Math.random() * newTree.edges.length)];
          } while (edge2 === edge1);
          
          const idx1 = newTree.edges.indexOf(edge1);
          const idx2 = newTree.edges.indexOf(edge2);
          [newTree.edges[idx1], newTree.edges[idx2]] = [newTree.edges[idx2], newTree.edges[idx1]];
        }
      } else {
        // Random edge swap
        const idx1 = Math.floor(Math.random() * newTree.edges.length);
        let idx2;
        do {
          idx2 = Math.floor(Math.random() * newTree.edges.length);
        } while (idx2 === idx1);
        
        [newTree.edges[idx1], newTree.edges[idx2]] = [newTree.edges[idx2], newTree.edges[idx1]];
      }
    }
  }
  
  // Shuffle subgraph edges (50% chance per subgraph)
  // But NEVER move subgraphs between different levels
  const scrambleSubgraph = (subgraph) => {
    // Shuffle edges within this subgraph
    if (subgraph.edges.length > 1 && Math.random() < 0.5) {
      shuffle(subgraph.edges);
    }
    
    // Shuffle nodes within this subgraph (only if safe)
    if (subgraph.nodes.length > 1 && Math.random() < 0.5) {
      // Filter out nodes with special characters or multiline content
      const safeNodes = subgraph.nodes.filter(isSafeToShuffle);
      const unsafeNodes = subgraph.nodes.filter(node => !isSafeToShuffle(node));
      
      if (safeNodes.length > 1) {
        // Shuffle only the safe nodes
        shuffle(safeNodes);
        
        // Reconstruct the nodes array with shuffled safe nodes and original unsafe nodes
        subgraph.nodes = [...safeNodes, ...unsafeNodes];
      }
    }
    
    // Process nested subgraphs (but don't move them between levels)
    subgraph.subgraphs.forEach(scrambleSubgraph);
    
    // Optionally shuffle the order of subgraphs at the same level
    if (subgraph.subgraphs.length > 1 && Math.random() < 0.3) {
      shuffle(subgraph.subgraphs);
    }
  };
  
  // Optionally shuffle the order of top-level subgraphs
  if (newTree.subgraphs.length > 1 && Math.random() < 0.3) {
    shuffle(newTree.subgraphs);
  }
  
  // Process each subgraph
  newTree.subgraphs.forEach(scrambleSubgraph);
  
  return newTree;
};

// Export for use in other modules
window.FlowScrambler = { scramble: scrambleFlow }; 