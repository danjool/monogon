// Converts flow tree back to Mermaid diagram syntax
const treeToMermaid = (tree) => {
  const lines = [];
  
  // remove all lines from header that are blank or just whitespace or tabs
  tree.header = tree.header.filter(line => line.trim() !== '' && line.trim() !== '\t');

  // Add header (comments, flowchart type, etc)
  lines.push(...tree.header);
  
  // Add main graph nodes
  tree.nodes.forEach(node => {
    // Use the raw content to preserve exact formatting
    lines.push(node.raw.trim());
  });
  
  // Add main graph edges
  tree.edges.forEach(edge => {
    // Use the raw content to preserve exact formatting
    lines.push(edge.raw);
  });
  
  // Helper to stringify subgraph
  const stringifySubgraph = (subgraph, indent = '') => {
    const subLines = [];
    indent = ''; // circumventing to avoid extra parse complexity
    
    // Add subgraph declaration
    subLines.push(`${indent}subgraph ${subgraph.name}`);
    
    // Add direction if present
    if (subgraph.direction) {
      subLines.push(`direction ${subgraph.direction}`);
    }
    
    // Add nodes and edges
    subgraph.nodes.forEach(node => {
      // For nodes with special characters or multiline content, use the raw content
      // with proper indentation to preserve exact formatting
      const rawLines = node.raw.split('\n');
      for (let i = 0; i < rawLines.length; i++) {
        if (i === 0) {
          subLines.push(`${indent}${rawLines[i].trim()}`);
        } else {
          // Preserve indentation for multiline content
          const lineIndent = ''; //rawLines[i].match(/^\s*/)[0];
          subLines.push(`${indent}${lineIndent}${rawLines[i].trim()}`);
        }
      }
    });
    
    subgraph.edges.forEach(edge => {
      // For edges, use the raw content with proper indentation
      const rawLines = edge.raw.split('\n');
      for (let i = 0; i < rawLines.length; i++) {
        if (i === 0) {
          subLines.push(`${indent}${rawLines[i].trim()}`);
        } else {
          // Preserve indentation for multiline content
          const lineIndent = rawLines[i].match(/^\s*/)[0];
          subLines.push(`${indent}${lineIndent}${rawLines[i].trim()}`);
        }
      }
    });
    
    // Add nested subgraphs (recursively)
    subgraph.subgraphs.forEach(sub => {
      subLines.push(...stringifySubgraph(sub, `${indent}`));
    });
    
    // Add end
    subLines.push(`${indent}end`);
    
    return subLines;
  };
  
  // Add all subgraphs
  tree.subgraphs.forEach(subgraph => {
    lines.push(...stringifySubgraph(subgraph));
  });
  
  console.log('lines', lines.join('\n'));
  return lines.join('\n');
};

// Export for use in other modules
window.FlowToMermaid = { convert: treeToMermaid }; 