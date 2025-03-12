// Converts flow tree back to Mermaid diagram syntax
const treeToMermaid = (tree) => {
  const lines = [];
  
  // Add header (comments, flowchart type, etc)
  lines.push(...tree.header);
  
  // Add main graph nodes
  tree.nodes.forEach(node => lines.push(node.raw));
  
  // Add main graph edges
  tree.edges.forEach(edge => lines.push(edge.raw));
  
  // Helper to stringify subgraph
  const stringifySubgraph = (subgraph, indent = '') => {
    const subLines = [];
    
    // Add subgraph declaration
    subLines.push(`${indent}subgraph ${subgraph.name}`);
    
    // Add nodes and edges
    subgraph.nodes.forEach(node => subLines.push(indent + '    ' + node.raw.trim()));
    subgraph.edges.forEach(edge => subLines.push(indent + '    ' + edge.raw.trim()));
    
    // Add nested subgraphs
    subgraph.subgraphs.forEach(sub => {
      subLines.push(...stringifySubgraph(sub, indent + '    '));
    });
    
    // Add end
    subLines.push(`${indent}end`);
    
    return subLines;
  };
  
  // Add all subgraphs
  tree.subgraphs.forEach(subgraph => {
    lines.push(...stringifySubgraph(subgraph));
  });
  
  return lines.join('\n');
};

// Export for use in other modules
window.FlowToMermaid = { convert: treeToMermaid }; 