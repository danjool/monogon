// Functions for scrambling node positions while preserving structure
function moveNodeMultipleHops(nodes, startIdx) {
  if (nodes.length <= 1) return;
  
  const node = nodes[startIdx];
  const maxHops = Math.min(5, Math.floor(nodes.length / 2));
  const hops = 1 + Math.floor(Math.random() * maxHops);
  
  nodes.splice(startIdx, 1);
  const newIdx = Math.random() < 0.5 
    ? (startIdx + hops) % nodes.length
    : (startIdx - hops + nodes.length) % nodes.length;
  
  nodes.splice(newIdx, 0, node);
}

function findNodesFromProblematicEdges(nodes, edges, problematicEdges) {
  if (!problematicEdges.length) return [];
  
  // Get node IDs from the nodes array
  const nodeIds = nodes.map(node => node.id || node.raw.split('[')[0].trim());
  
  // Find edges that match problematic patterns
  const problematicMatches = edges.filter(edge => 
    problematicEdges.some(probEdge => edge.raw.includes(probEdge))
  );
  
  // Extract node IDs from those edges
  const connectedNodeIds = new Set();
  problematicMatches.forEach(edge => {
    const [source, target] = edge.raw.split(/->|---|<-|~~~/).map(s => s.trim());
    if (nodeIds.includes(source)) connectedNodeIds.add(source);
    if (nodeIds.includes(target)) connectedNodeIds.add(target);
  });
  
  // Return indices of nodes connected to problematic edges
  return nodes
    .map((node, idx) => ({ node, idx }))
    .filter(({ node }) => connectedNodeIds.has(node.id || node.raw.split('[')[0].trim()))
    .map(({ idx }) => idx);
}

function scrambleNodes(tree, problematicEdges = []) {
  // Scramble main nodes
  if (tree.nodes.length > 1) {
    const problematicNodeIndices = findNodesFromProblematicEdges(tree.nodes, tree.edges, problematicEdges);
    
    if (problematicNodeIndices.length && Math.random() < 0.6) {
      // Prioritize moving problematic nodes
      const startIdx = problematicNodeIndices[Math.floor(Math.random() * problematicNodeIndices.length)];
      moveNodeMultipleHops(tree.nodes, startIdx);
    } else if (Math.random() < 0.5) {
      // Regular random node movement
      const startIdx = Math.floor(Math.random() * tree.nodes.length);
      moveNodeMultipleHops(tree.nodes, startIdx);
    }
  }

  // Recursively scramble subgraph nodes
  tree.subgraphs.forEach(subgraph => {
    if (subgraph.nodes.length > 1) {
      const problematicNodeIndices = findNodesFromProblematicEdges(subgraph.nodes, subgraph.edges, problematicEdges);
      
      if (problematicNodeIndices.length && Math.random() < 0.6) {
        const startIdx = problematicNodeIndices[Math.floor(Math.random() * problematicNodeIndices.length)];
        moveNodeMultipleHops(subgraph.nodes, startIdx);
      } else if (Math.random() < 0.5) {
        const startIdx = Math.floor(Math.random() * subgraph.nodes.length);
        moveNodeMultipleHops(subgraph.nodes, startIdx);
      }
    }
    scrambleNodes(subgraph, problematicEdges); // Recurse into nested subgraphs
  });

  return tree;
}

window.NodeScrambler = {
  scrambleNodes
}; 