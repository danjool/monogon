// Parses Mermaid flowchart syntax into a manipulatable tree structure
const parseFlow = (code) => {
  const lines = code.split('\n');
  
  // Tree structure
  const tree = {
    type: 'root',
    header: [], // Holds flowchart type, direction, etc
    nodes: [],  // Main graph nodes
    edges: [],  // Main graph edges
    subgraphs: [], // Nested subgraphs
  };
  
  let currentSubgraph = null;
  let inSubgraph = false;
  let indentLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('%%')) {
      tree.header.push(lines[i]);
      continue;
    }
    
    // Track subgraph boundaries
    if (line.startsWith('subgraph')) {
      inSubgraph = true;
      indentLevel = lines[i].match(/^\s*/)[0].length;
      
      currentSubgraph = {
        type: 'subgraph',
        name: line.substring(9).trim(),
        nodes: [],
        edges: [],
        subgraphs: [],
        raw: [lines[i]]
      };
      continue;
    }
    
    if (inSubgraph && line === 'end' && lines[i].match(/^\s*/)[0].length === indentLevel) {
      currentSubgraph.raw.push(lines[i]);
      tree.subgraphs.push(currentSubgraph);
      currentSubgraph = null;
      inSubgraph = false;
      continue;
    }
    
    // Process nodes and edges
    if (line.includes('-->')) {
      const edge = {
        type: 'edge',
        content: lines[i],
        raw: lines[i]
      };
      
      if (inSubgraph) {
        currentSubgraph.edges.push(edge);
        currentSubgraph.raw.push(lines[i]);
      } else {
        tree.edges.push(edge);
      }
    } else {
      const node = {
        type: 'node',
        content: lines[i],
        raw: lines[i]
      };
      
      if (inSubgraph) {
        currentSubgraph.nodes.push(node);
        currentSubgraph.raw.push(lines[i]);
      } else {
        tree.nodes.push(node);
      }
    }
  }
  
  return tree;
};

// Export for use in other modules
window.FlowParser = { parse: parseFlow }; 