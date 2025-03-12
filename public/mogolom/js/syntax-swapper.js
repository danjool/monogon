// Functions for generating variations of mermaid diagrams while preserving semantics and subgraph structure

// Generate a variation of the diagram by permuting elements within their respective scopes
function generateVariation(code, problematicEdges = []) {
  // Parse flowchart into tree structure
  const tree = window.FlowParser.parse(code);
  
  // Generate variation by scrambling the tree
  const scrambledTree = window.FlowScrambler.scramble(tree, problematicEdges);
  
  // Convert back to Mermaid syntax
  return window.FlowToMermaid.convert(scrambledTree);
}

// Export functions for use in other modules
window.SyntaxSwapper = {
  generateVariation
};