// Functions for managing invisible edges
function removeInvisibleEdges(edges) {
  return edges.filter(e => !e.raw.includes('~~~'));
}

function collectAllNodes(tree, allNodes = []) {
  if (tree.nodes) allNodes.push(...tree.nodes);
  tree.subgraphs.forEach(sg => collectAllNodes(sg, allNodes));
  return allNodes;
}

function findNodesFromProblematicEdges(edges, problematicEdges) {
  if (!problematicEdges.length) return [];
  
  // Find edges that match problematic patterns
  const problematicMatches = edges.filter(edge => 
    problematicEdges.some(probEdge => edge.raw.includes(probEdge))
  );
  
  // Extract source and target nodes from problematic edges
  const nodePairs = problematicMatches.map(edge => {
    const [source, target] = edge.raw.split(/->|---|<-|~~~/).map(s => s.trim());
    return { source, target };
  });
  
  return nodePairs;
}

function addInvisibleEdges(tree, problematicEdges = [], longestPaths = []) {
  const allNodes = collectAllNodes(tree);
  const existingCombos = new Set();
  
  // Create a combined priority list with both problematic edges and longest paths
  const priorityEdges = [...new Set([...problematicEdges, ...longestPaths])];
  
  // First try to add invisible edges between problematic or long nodes
  const problematicPairs = findNodesFromProblematicEdges(tree.edges, priorityEdges);
  
  if (problematicPairs.length && Math.random() < 0.6) {
    // Pick a random problematic edge and create an invisible edge from target to source
    const pair = problematicPairs[Math.floor(Math.random() * problematicPairs.length)];
    const combo = `${pair.target}~~~${pair.source}`;
    
    if (!existingCombos.has(combo)) {
      const newEdge = {
        raw: `${pair.target} ~~~ ${pair.source}`,
        type: 'invisible',
        source: pair.target,
        target: pair.source
      };
      
      const randomIndex = Math.floor(Math.random() * (tree.edges.length + 1));
      tree.edges.splice(randomIndex, 0, newEdge);
      existingCombos.add(combo);
    }
  }
  
  // Adaptive decision based on current invisible edge count
  // If we already have many invisible edges (>20% of total), reduce chance of adding more
  const invisibleEdgeCount = tree.edges.filter(e => e.raw.includes('~~~')).length;
  const totalEdgeCount = tree.edges.length;
  const invisibleRatio = totalEdgeCount > 0 ? invisibleEdgeCount / totalEdgeCount : 0;
  
  const addRandomChance = Math.max(0.3 - (invisibleRatio * 0.5), 0.05);
  
  // Then maybe add some random invisible edges
  if (Math.random() < addRandomChance && allNodes.length > 1) {
    const numToAdd = 1 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numToAdd; i++) {
      const idx1 = Math.floor(Math.random() * allNodes.length);
      let idx2;
      do {
        idx2 = Math.floor(Math.random() * allNodes.length);
      } while (idx2 === idx1);
      
      const sourceNode = allNodes[idx1];
      const targetNode = allNodes[idx2];
      const sourceId = sourceNode.id || sourceNode.raw.split('[')[0].trim();
      const targetId = targetNode.id || targetNode.raw.split('[')[0].trim();
      const combo = `${sourceId}~~~${targetId}`;
      
      if (!existingCombos.has(combo)) {
        const newEdge = {
          raw: `${sourceId} ~~~ ${targetId}`,
          type: 'invisible',
          source: sourceId,
          target: targetId
        };
        
        const randomIndex = Math.floor(Math.random() * (tree.edges.length + 1));
        tree.edges.splice(randomIndex, 0, newEdge);
        existingCombos.add(combo);
      }
    }
  }
  
  return tree;
}

window.InvisibleEdgeScrambler = {
  removeInvisibleEdges,
  addInvisibleEdges
}; 