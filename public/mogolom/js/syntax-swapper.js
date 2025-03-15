// Functions for generating variations of mermaid diagrams while preserving semantics and subgraph structure

function calculateScrambleProbabilities(iterationsWithoutImprovement, currentScore, metrics, problematicEdges, longestPaths) {
  // Base probabilities
  const base = {
    node: 0.7,
    edge: 0.1,
    removeInvisible: 0.03,
    addInvisible: 0.1
  };

  // Increase probabilities based on being stuck
  const stuckFactor = Math.min(iterationsWithoutImprovement / 20, 1); // Max out at 20 iterations
  
  // Increase probabilities based on poor score
  const scoreFactor = Math.min(currentScore / 10, 1); // Max out at score of 10
  
  // Adjust based on metrics if available
  let complexityFactor = 0;
  let sizeFactor = 0;
  let invisibleFactor = 0;
  
  if (metrics) {
    // Complexity factor based on number of nodes and edges
    const totalElements = metrics.nodes + metrics.edges.total;
    complexityFactor = Math.min(totalElements / 50, 1); // Normalize to 0-1 range
    
    // Size factor based on diagram dimensions
    sizeFactor = Math.min(metrics.dimensions.area / 300000, 1); // Normalize to 0-1 range
    
    // Invisible edge factor
    invisibleFactor = metrics.edges.invisible > 0 ? 
      Math.min(metrics.edges.invisible / metrics.edges.total, 0.5) : 0;
  }
  
  // Prioritize edge operations when we have long paths
  const longPathFactor = longestPaths && longestPaths.length > 0 ? 0.2 : 0;
  
  // Combine all factors
  return {
    // Node scrambling - increase with complexity, decrease with size
    node: Math.min(base.node + (stuckFactor * 0.02) + (scoreFactor * 0.01) + (complexityFactor * 0.01) - (sizeFactor * 0.01), 0.95),
    
    // Edge scrambling - increase with problematic edges and long paths
    edge: Math.min(base.edge + (stuckFactor * 0.15) + (scoreFactor * 0.05) + (longPathFactor * 0.02) + (problematicEdges.length * 0.05), 0.95),
    
    // Invisible edge removal - increase with higher invisible edge count
    removeInvisible: Math.min(base.removeInvisible + (stuckFactor * 0.07) + (invisibleFactor * 0.3), 0.4),
    
    // Add invisible edges - increase with complexity and score
    addInvisible: Math.min(base.addInvisible + (stuckFactor * 0.2) + (scoreFactor * 0.1) - (invisibleFactor * 0.2), 0.4)
  };
}

function generateVariation(code, problematicEdges = [], iterationsWithoutImprovement = 0, currentScore = 0, metrics = null, longestPaths = []) {
  // Parse flowchart into tree structure
  const tree = window.FlowParser.parse(code);
  
  // Create a deep clone to avoid mutating the original
  let scrambledTree = JSON.parse(JSON.stringify(tree));
  
  // Calculate adaptive probabilities with enhanced metrics
  const probs = calculateScrambleProbabilities(
    iterationsWithoutImprovement, 
    currentScore,
    metrics,
    problematicEdges,
    longestPaths
  );

  // console.log('Scramble probabilities:', probs, 'from', iterationsWithoutImprovement, currentScore, metrics, problematicEdges.length, longestPaths.length);
  
  // Apply scrambling strategies with adaptive probabilities
  if (Math.random() < probs.node) scrambledTree = window.NodeScrambler.scrambleNodes(scrambledTree, problematicEdges);
  if (Math.random() < probs.edge) scrambledTree = window.EdgeScrambler.scrambleEdges(scrambledTree, problematicEdges, longestPaths);
  // Re-enabled invisible edge manipulation with improved handling for complex node shapes
  if (Math.random() < probs.removeInvisible) scrambledTree.edges = window.InvisibleEdgeScrambler.removeInvisibleEdges(scrambledTree.edges, 1);
  if (Math.random() < probs.addInvisible) scrambledTree = window.InvisibleEdgeScrambler.addInvisibleEdges(scrambledTree, problematicEdges, longestPaths);
  
  // Convert back to Mermaid syntax
  return window.FlowToMermaid.convert(scrambledTree);
}

// Export functions for use in other modules
window.SyntaxSwapper = {
  generateVariation
};
