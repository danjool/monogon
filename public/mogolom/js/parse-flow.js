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
  
  // Stack to track nested subgraphs
  const subgraphStack = [];
  
  // Track flowchart header
  let foundFlowchartHeader = false;
  
  // Track multiline node content
  let inMultilineNode = false;
  let currentMultilineNode = null;
  let multilineQuoteType = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const indentation = lines[i].match(/^\s*/)[0].length;
    
    // Skip empty lines and comments
    if (!line || line.startsWith('%%')) {
      tree.header.push(lines[i]);
      continue;
    }
    
    // Handle multiline node content
    if (inMultilineNode) {
      currentMultilineNode.raw += '\n' + lines[i];
      currentMultilineNode.content += '\n' + line;
      
      // Check if this line ends the multiline content
      if (line.endsWith(multilineQuoteType)) {
        inMultilineNode = false;
        multilineQuoteType = '';
      }
      continue;
    }
    
    // Capture flowchart header
    if (!foundFlowchartHeader && line.startsWith('flowchart')) {
      tree.header.push(lines[i]);
      foundFlowchartHeader = true;
      continue;
    }
    
    // Track subgraph boundaries
    if (line.startsWith('subgraph')) {
      const newSubgraph = {
        type: 'subgraph',
        name: line.substring(9).trim(),
        nodes: [],
        edges: [],
        subgraphs: [],
        indentation: indentation,
        raw: [lines[i]]
      };
      
      // Add to parent or root
      if (subgraphStack.length > 0) {
        subgraphStack[subgraphStack.length - 1].subgraphs.push(newSubgraph);
      } else {
        tree.subgraphs.push(newSubgraph);
      }
      
      // Push to stack
      subgraphStack.push(newSubgraph);
      continue;
    }
    
    if (line === 'end') {
      // Check if this 'end' matches the indentation of the current subgraph
      if (subgraphStack.length > 0) {
        // Pop the most recent subgraph from the stack
        const currentSubgraph = subgraphStack.pop();
        currentSubgraph.raw.push(lines[i]);
      }
      continue;
    }
    
    // Process nodes and edges
    if (line.includes('-->')) {
      const edge = {
        type: 'edge',
        content: line,
        raw: lines[i]
      };
      
      if (subgraphStack.length > 0) {
        subgraphStack[subgraphStack.length - 1].edges.push(edge);
        subgraphStack[subgraphStack.length - 1].raw.push(lines[i]);
      } else {
        tree.edges.push(edge);
      }
    } else if (line) { // Only process non-empty lines
      // Check for direction statements in subgraphs
      if (line.startsWith('direction')) {
        if (subgraphStack.length > 0) {
          // Add direction as a special property to the subgraph
          subgraphStack[subgraphStack.length - 1].direction = line;
          subgraphStack[subgraphStack.length - 1].raw.push(lines[i]);
        } else {
          // Add to header if not in a subgraph
          tree.header.push(lines[i]);
        }
        continue;
      }
      
      // Check for multiline node content (starts with quote but doesn't end with one)
      const startsWithQuote = line.includes('["') || line.includes('("');
      const endsWithQuote = line.includes('"]') || line.includes('")');
      
      if (startsWithQuote && !endsWithQuote) {
        inMultilineNode = true;
        multilineQuoteType = line.includes('["') ? '"]' : '")';
      }
      
      const node = {
        type: 'node',
        content: line,
        raw: lines[i],
        // Add a flag to indicate if this node contains special characters
        hasSpecialChars: /[•\u2022\-\*]/.test(line)
      };
      
      if (inMultilineNode) {
        currentMultilineNode = node;
      }
      
      if (subgraphStack.length > 0) {
        subgraphStack[subgraphStack.length - 1].nodes.push(node);
        subgraphStack[subgraphStack.length - 1].raw.push(lines[i]);
      } else {
        tree.nodes.push(node);
      }
    }
  }
  
  // Handle any unclosed subgraphs (shouldn't happen in valid syntax)
  while (subgraphStack.length > 0) {
    console.warn('Unclosed subgraph detected');
    subgraphStack.pop();
  }
  
  return tree;
};

// Export for use in other modules
window.FlowParser = { parse: parseFlow }; 