// Functions for managing invisible edges
// Enhanced to handle complex node shapes and avoid problematic invisible edges

/**
 * Checks if a node has a complex shape that might cause issues with invisible edges
 * @param {Object} node - The node object to check
 * @returns {boolean} - True if the node has a complex shape
 */
function isComplexShape(node) {
  if (!node || !node.shape) return false;
  
  // List of complex shapes that might cause issues with invisible edges
  const complexShapes = [
    'stadium',      // ([text])
    'trapezoid',    // [/text\]
    'trapezoidAlt', // [\text/]
    'parallelogram', // [/text/]
    'parallelogramAlt', // [\text\]
    'hexagon',      // {{text}}
    'doubleCircle'  // (((text)))
  ];
  
  return complexShapes.includes(node.shape);
}

/**
 * Finds a node by its ID in the tree
 * @param {Array} nodes - Array of nodes to search
 * @param {string} id - ID of the node to find
 * @returns {Object|null} - The node object or null if not found
 */
function findNodeById(nodes, id) {
  if (!nodes || !id) return null;
  
  // Clean the ID (remove any brackets, quotes, etc.)
  const cleanId = id.replace(/[\[\]\(\)\{\}"']/g, '').trim();
  
  // Try to find the node by ID or by the first part of its raw content
  return nodes.find(node => {
    // Check if node has an explicit ID that matches
    if (node.id && node.id === cleanId) return true;
    
    // Check if the node's raw content starts with the ID
    const nodeContent = node.raw || node.content || '';
    const contentParts = nodeContent.split(/[\[\]\(\)\{\}"']/)[0].trim();
    
    return contentParts === cleanId;
  }) || null;
}

function removeInvisibleEdges(edges, n=1) {
  // Filter out invisible edges
  const invisibleEdges = edges.filter(edge => edge.type === 'invisible');
  
  // If no invisible edges, return original edges
  if (!invisibleEdges.length) return edges;
  
  // Remove n random invisible edges
  const numToRemove = Math.min(n, invisibleEdges.length);
  const removedIndices = new Set();
  
  for (let i = 0; i < numToRemove; i++) {
    let index;
    do {
      index = Math.floor(Math.random() * edges.length);
    } while (!edges[index].type === 'invisible' || removedIndices.has(index));
    removedIndices.add(index);
  }
  
  // Return edges with selected invisible ones removed
  return edges.filter((_, i) => !removedIndices.has(i));
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
    // Try up to 3 times to find a pair without complex shapes
    let attempts = 0;
    let validPairFound = false;
    
    while (attempts < 3 && !validPairFound) {
      const pair = problematicPairs[Math.floor(Math.random() * problematicPairs.length)];
      const combo = `${pair.target}~~~${pair.source}`;
      
      // Skip if this combination already exists
      if (existingCombos.has(combo)) {
        attempts++;
        continue;
      }
      
      // Find the actual node objects
      const sourceNode = findNodeById(allNodes, pair.target);
      const targetNode = findNodeById(allNodes, pair.source);
      
      // Skip if either node has a complex shape
      if ((sourceNode && isComplexShape(sourceNode)) || 
          (targetNode && isComplexShape(targetNode))) {
        attempts++;
        continue;
      }
      
      // Valid pair found, add the invisible edge
      const newEdge = {
        raw: `${pair.target} ~~~ ${pair.source}`,
        type: 'invisible',
        source: pair.target,
        target: pair.source
      };
      
      const randomIndex = Math.floor(Math.random() * (tree.edges.length + 1));
      tree.edges.splice(randomIndex, 0, newEdge);
      existingCombos.add(combo);
      validPairFound = true;
    }
  }
  
  // Adaptive decision based on current invisible edge count
  // If we already have many invisible edges (>20% of total), reduce chance of adding more
  const invisibleEdgeCount = tree.edges.filter(e => e.raw.includes('~~~')).length;
  const totalEdgeCount = tree.edges.length;
  const invisibleRatio = totalEdgeCount > 0 ? invisibleEdgeCount / totalEdgeCount : 0;
  
  // Further reduce chance if we have many complex nodes
  const complexNodeCount = allNodes.filter(node => isComplexShape(node)).length;
  const complexNodeRatio = allNodes.length > 0 ? complexNodeCount / allNodes.length : 0;
  
  // Adjust chance based on both invisible edge ratio and complex node ratio
  const addRandomChance = Math.max(0.3 - (invisibleRatio * 0.5) - (complexNodeRatio * 0.3), 0.05);
  
  // Then maybe add some random invisible edges
  if (Math.random() < addRandomChance && allNodes.length > 1) {
    const numToAdd = 1 + Math.floor(Math.random() * 2);
    let addedCount = 0;
    let attempts = 0;
    
    // Try to add up to numToAdd invisible edges, with a maximum of 10 attempts
    while (addedCount < numToAdd && attempts < 10) {
      attempts++;
      
      // Select random nodes
      const idx1 = Math.floor(Math.random() * allNodes.length);
      let idx2;
      do {
        idx2 = Math.floor(Math.random() * allNodes.length);
      } while (idx2 === idx1);
      
      const sourceNode = allNodes[idx1];
      const targetNode = allNodes[idx2];
      
      // Skip if either node has a complex shape
      if (isComplexShape(sourceNode) || isComplexShape(targetNode)) {
        continue;
      }
      
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
        addedCount++;
      }
    }
  }
  
  return tree;
}

window.InvisibleEdgeScrambler = {
  removeInvisibleEdges,
  addInvisibleEdges
};
