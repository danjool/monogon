// Handles legal tree manipulations while preserving structure
const scrambleFlow = (tree, problematicEdges = []) => {
    // console.log('Scrambling flow:', JSON.stringify(tree, null, 2));
    // console.log('Problematic edges:', problematicEdges);
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

  // NEW FUNCTION: Move a node multiple hops while maintaining subgraph integrity
  const moveNodeMultipleHops = (nodes, startIdx) => {
    if (nodes.length <= 1) return;
    
    const node = nodes[startIdx];
    const maxHops = Math.min(5, Math.floor(nodes.length / 2)); // Limit max hops
    const hops = 1 + Math.floor(Math.random() * maxHops);
    
    // Remove the node from its current position
    nodes.splice(startIdx, 1);
    
    // Calculate new position (can be before or after original position)
    let newIdx;
    if (Math.random() < 0.5) {
      // Move forward
      newIdx = (startIdx + hops) % nodes.length;
    } else {
      // Move backward
      newIdx = (startIdx - hops + nodes.length) % nodes.length;
    }
    
    // Insert at new position
    nodes.splice(newIdx, 0, node);
  };
  
  // NEW FUNCTION: Add or remove invisible edges at root level
  const manipulateInvisibleEdges = (tree, nodes) => {
    // Remove any existing invisible edges from all levels and collect nodes
    const allNodes = [...(nodes || [])];
    const removeInvisibleEdges = (edges) => {
      return edges.filter(e => !e.raw.includes('~~~'));
    };
    
    const collectNodesFromSubgraph = (subgraph) => {
      if (subgraph.nodes) {
        allNodes.push(...subgraph.nodes);
      }
      if (subgraph.subgraphs) {
        subgraph.subgraphs.forEach(collectNodesFromSubgraph);
      }
    };
    
    // Clean existing invisible edges from tree and collect all nodes
    tree.edges = removeInvisibleEdges(tree.edges);
    tree.subgraphs.forEach(subgraph => {
      collectNodesFromSubgraph(subgraph);
      const cleanSubgraph = (sg) => {
        sg.edges = removeInvisibleEdges(sg.edges);
        sg.subgraphs.forEach(cleanSubgraph);
      };
      cleanSubgraph(subgraph);
    });
    
    // Track existing invisible edge combinations to prevent duplicates
    const existingCombos = new Set();
    
    // 30% chance to add invisible edges
    if (Math.random() < 0.3 && allNodes.length > 1) {
      const numToAdd = 1 + Math.floor(Math.random() * 2); // Add 1-2 invisible edges
      
      for (let i = 0; i < numToAdd; i++) {
        // Pick two random nodes to connect
        const idx1 = Math.floor(Math.random() * allNodes.length);
        let idx2;
        do {
          idx2 = Math.floor(Math.random() * allNodes.length);
        } while (idx2 === idx1);
        
        const sourceNode = allNodes[idx1];
        const targetNode = allNodes[idx2];
        
        // Extract node IDs (assuming nodes have an id property or can be identified from raw)
        const sourceId = sourceNode.id || sourceNode.raw.split('[')[0].trim();
        const targetId = targetNode.id || targetNode.raw.split('[')[0].trim();
        
        // Check for duplicates (in only one direction)
        const combo1 = `${sourceId}~~~${targetId}`;
        
        if (!existingCombos.has(combo1)) {
          // Create a new invisible edge
          const newEdge = {
            raw: `${sourceId} ~~~ ${targetId}`,
            type: 'invisible',
            source: sourceId,
            target: targetId
          };
          
          // Add to root level edges
          // tree.edges.push(newEdge);
          // actually let's put them near the beginning of the edges array
          // tree.edges.unshift(newEdge);
          // actually let's put them randomly throughout the edges array, top level of the tree
          const randomIndex = Math.floor(Math.random() * (tree.edges.length + 1));
          console.log('Adding invisible edge at index:', randomIndex, ' newEdge:', newEdge);
          tree.edges.splice(randomIndex, 0, newEdge);
          
          // Track this combination
          existingCombos.add(combo1);
        }
      }
    }
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
        // Use multi-hop movement instead of simple swap (50% chance)
        if (Math.random() < 0.5 && newTree.edges.length > 2) {
          const startIdx = Math.floor(Math.random() * newTree.edges.length);
          moveNodeMultipleHops(newTree.edges, startIdx);
        } else {
          // Random edge swap (original behavior)
          const idx1 = Math.floor(Math.random() * newTree.edges.length);
          let idx2;
          do {
            idx2 = Math.floor(Math.random() * newTree.edges.length);
          } while (idx2 === idx1);
          
          [newTree.edges[idx1], newTree.edges[idx2]] = [newTree.edges[idx2], newTree.edges[idx1]];
        }
      }
    }
  }
  
  // Add invisible edges at root level using all nodes from tree
  manipulateInvisibleEdges(newTree, newTree.nodes);
  
  // Shuffle subgraph edges (50% chance per subgraph)
  // But NEVER move subgraphs between different levels
  const scrambleSubgraph = (subgraph) => {
    // Shuffle edges within this subgraph
    if (subgraph.edges.length > 1 && Math.random() < 0.5) {
      // Use multi-hop movement for subgraph edges (60% chance)
      if (Math.random() < 0.6 && subgraph.edges.length > 2) {
        const numMoves = 1 + Math.floor(Math.random() * Math.min(3, subgraph.edges.length));
        for (let i = 0; i < numMoves; i++) {
          const startIdx = Math.floor(Math.random() * subgraph.edges.length);
          moveNodeMultipleHops(subgraph.edges, startIdx);
        }
      } else {
        // Original behavior
        shuffle(subgraph.edges);
      }
    }
    
    // Shuffle nodes within this subgraph (only if safe)
    if (subgraph.nodes.length > 1 && Math.random() < 0.5) {
      // Filter out nodes with special characters or multiline content
      const safeNodes = subgraph.nodes.filter(isSafeToShuffle);
      const unsafeNodes = subgraph.nodes.filter(node => !isSafeToShuffle(node));
      
      if (safeNodes.length > 1) {
        // Use multi-hop movement for nodes (70% chance)
        if (Math.random() < 0.7 && safeNodes.length > 2) {
          const numMoves = 1 + Math.floor(Math.random() * Math.min(3, safeNodes.length));
          for (let i = 0; i < numMoves; i++) {
            const startIdx = Math.floor(Math.random() * safeNodes.length);
            moveNodeMultipleHops(safeNodes, startIdx);
          }
        } else {
          // Original behavior
          shuffle(safeNodes);
        }
        
        // Reconstruct the nodes array with shuffled safe nodes and original unsafe nodes
        subgraph.nodes = [...safeNodes, ...unsafeNodes];
      }
    }
    
    // Process nested subgraphs (but don't move them between levels)
    subgraph.subgraphs.forEach(scrambleSubgraph);
    
    // Optionally shuffle the order of subgraphs at the same level
    if (subgraph.subgraphs.length > 1 && Math.random() < 0.3) {
      // Use multi-hop movement for subgraphs (50% chance)
      if (Math.random() < 0.5 && subgraph.subgraphs.length > 2) {
        const startIdx = Math.floor(Math.random() * subgraph.subgraphs.length);
        moveNodeMultipleHops(subgraph.subgraphs, startIdx);
      } else {
        // Original behavior
        shuffle(subgraph.subgraphs);
      }
    }
  };
  
  // Optionally shuffle the order of top-level subgraphs
  if (newTree.subgraphs.length > 1 && Math.random() < 0.3) {
    // Use multi-hop movement for top-level subgraphs (50% chance)
    if (Math.random() < 0.5 && newTree.subgraphs.length > 2) {
      const startIdx = Math.floor(Math.random() * newTree.subgraphs.length);
      moveNodeMultipleHops(newTree.subgraphs, startIdx);
    } else {
      // Original behavior
      shuffle(newTree.subgraphs);
    }
  }
  
  // Process each subgraph
  newTree.subgraphs.forEach(scrambleSubgraph);
  
  return newTree;
};

// Export for use in other modules
window.FlowScrambler = { scramble: scrambleFlow }; 