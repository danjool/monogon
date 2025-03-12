// Functions for generating variations of mermaid diagrams while preserving semantics and subgraph structure

// Generate a variation of the diagram by permuting elements within their respective scopes
function generateVariation(code, problematicEdges = []) {
  // Parse flowchart into tree structure
  const tree = window.FlowParser.parse(code);
  
  // Create a deep clone to avoid mutating the original
  let scrambledTree = JSON.parse(JSON.stringify(tree));
  
  // Apply scrambling strategies with different probabilities
  if (Math.random() < 0.7) scrambledTree = window.NodeScrambler.scrambleNodes(scrambledTree, problematicEdges);
  if (Math.random() < 0.8) scrambledTree = window.EdgeScrambler.scrambleEdges(scrambledTree, problematicEdges);
  if (Math.random() < 0.03) scrambledTree.edges = window.InvisibleEdgeScrambler.removeInvisibleEdges(scrambledTree.edges);
  if (Math.random() < 0.1) scrambledTree = window.InvisibleEdgeScrambler.addInvisibleEdges(scrambledTree, problematicEdges);
  
  // Convert back to Mermaid syntax
  return window.FlowToMermaid.convert(scrambledTree);
}

// Export functions for use in other modules
window.SyntaxSwapper = {
  generateVariation
};