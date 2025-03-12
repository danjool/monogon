// Functions for generating variations of mermaid diagrams while preserving semantics and subgraph structure

function calculateScrambleProbabilities(iterationsWithoutImprovement, currentScore) {
  // Base probabilities
  const base = {
    node: 0.7,
    edge: 0.8,
    removeInvisible: 0.03,
    addInvisible: 0.1
  };

  // Increase probabilities based on being stuck
  const stuckFactor = Math.min(iterationsWithoutImprovement / 20, 1); // Max out at 20 iterations
  
  // Increase probabilities based on poor score
  const scoreFactor = Math.min(currentScore / 10, 1); // Max out at score of 10
  console.log(scoreFactor, stuckFactor);
  
  return {
    node: Math.min(base.node + (stuckFactor * 0.2) + (scoreFactor * 0.1), 0.95),
    edge: Math.min(base.edge + (stuckFactor * 0.15) + (scoreFactor * 0.05), 0.95),
    removeInvisible: Math.min(base.removeInvisible + (stuckFactor * 0.07), 0.2),
    addInvisible: Math.min(base.addInvisible + (stuckFactor * 0.2) + (scoreFactor * 0.1), 0.4)
  };
}

function generateVariation(code, problematicEdges = [], iterationsWithoutImprovement = 0, currentScore = 0) {
  // Parse flowchart into tree structure
  const tree = window.FlowParser.parse(code);
  
  // Create a deep clone to avoid mutating the original
  let scrambledTree = JSON.parse(JSON.stringify(tree));
  
  // Calculate adaptive probabilities
  const probs = calculateScrambleProbabilities(iterationsWithoutImprovement, currentScore);
  console.log(probs, 'from', iterationsWithoutImprovement, currentScore);
  
  // Apply scrambling strategies with adaptive probabilities
  if (Math.random() < probs.node) scrambledTree = window.NodeScrambler.scrambleNodes(scrambledTree, problematicEdges);
  if (Math.random() < probs.edge) scrambledTree = window.EdgeScrambler.scrambleEdges(scrambledTree, problematicEdges);
  if (Math.random() < probs.removeInvisible) scrambledTree.edges = window.InvisibleEdgeScrambler.removeInvisibleEdges(scrambledTree.edges);
  if (Math.random() < probs.addInvisible) scrambledTree = window.InvisibleEdgeScrambler.addInvisibleEdges(scrambledTree, problematicEdges);
  
  // Convert back to Mermaid syntax
  return window.FlowToMermaid.convert(scrambledTree);
}

// Export functions for use in other modules
window.SyntaxSwapper = {
  generateVariation
};