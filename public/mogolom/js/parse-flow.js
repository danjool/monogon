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
  
  // Helper function to determine node shape
  function determineNodeShape(line) {
    if (line.includes('(((') && line.includes(')))')) return 'doubleCircle';
    if (line.includes('((') && line.includes('))')) return 'circle';
    if (line.includes('{{') && line.includes('}}')) return 'hexagon';
    if (line.includes('{') && line.includes('}')) return 'rhombus';
    if (line.includes('[[') && line.includes(']]')) return 'subroutine';
    if (line.includes('[(') && line.includes(')]')) return 'cylindrical';
    if (line.includes('([') && line.includes('])')) return 'stadium';
    if (line.includes('[/') && line.includes('/]')) return 'parallelogram';
    if (line.includes('[\\') && line.includes('\\]')) return 'parallelogramAlt';
    if (line.includes('[/') && line.includes('\\]')) return 'trapezoid';
    if (line.includes('[\\') && line.includes('/]')) return 'trapezoidAlt';
    if (line.includes('(') && line.includes(')')) return 'roundEdges';
    if (line.includes('[') && line.includes(']')) return 'rectangle';
    if (line.includes('>') && line.includes(']')) return 'asymmetric';
    return 'default';
  }
  
  // Helper function to determine link type and extract text
  function analyzeLinkProperties(line) {
    const result = {
      type: 'unknown',
      text: null,
      isBidirectional: false
    };
    
    // Check for bidirectional links
    if (line.includes('<-->') || line.includes('<===') || line.includes('<-.->')) {
      result.isBidirectional = true;
    }
    
    // Determine link type
    if (line.includes('-.->')) result.type = 'dottedArrow';
    else if (line.includes('-.-')) result.type = 'dotted';
    else if (line.includes('==>')) result.type = 'thickArrow';
    else if (line.includes('===')) result.type = 'thick';
    else if (line.includes('-->')) result.type = 'arrow';
    else if (line.includes('---')) result.type = 'line';
    else if (line.includes('~~~')) result.type = 'invisible';
    else if (line.includes('--o')) result.type = 'circleEnd';
    else if (line.includes('--x')) result.type = 'crossEnd';
    else if (line.includes('o--o')) result.type = 'circleBoth';
    else if (line.includes('x--x')) result.type = 'crossBoth';
    
    // Extract link text - this is simplified and would need more robust patterns
    // Check for |text| format
    let textMatch = line.match(/-->\|(.*?)\|/);
    if (textMatch) result.text = textMatch[1];
    
    // Check for -- text --> format
    if (!result.text) {
      textMatch = line.match(/--\s+(.*?)\s+-->/);
      if (textMatch) result.text = textMatch[1];
    }
    
    // Similar patterns would be needed for other link types
    
    return result;
  }
  
  // Helper to check if a line contains any link syntax
  function containsLinkSyntax(line) {
    return line.includes('-->') || line.includes('---') || 
           line.includes('-.-') || line.includes('==>') || 
           line.includes('===') || line.includes('~~~') ||
           line.includes('--o') || line.includes('--x') ||
           line.includes('<-->') || line.includes('o--o') || 
           line.includes('x--x');
  }
  
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
    if (!foundFlowchartHeader && (line.startsWith('flowchart') || line.startsWith('graph'))) {
      tree.header.push(lines[i]);
      foundFlowchartHeader = true;
      continue;
    }
    
    // Track subgraph boundaries
    if (line.startsWith('subgraph')) {
      // Check for explicit ID format: subgraph id [title]
      const idMatch = line.match(/subgraph\s+(\w+)\s+\[(.*?)\]/);
      
      const newSubgraph = {
        type: 'subgraph',
        indentation: indentation,
        raw: [lines[i]],
        nodes: [],
        edges: [],
        subgraphs: []
      };
      
      if (idMatch) {
        newSubgraph.id = idMatch[1];
        newSubgraph.name = idMatch[2];
      } else {
        newSubgraph.name = line.substring(9).trim();
      }
      
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
    
    // Check for direction statements
    if (line.startsWith('direction')) {
      if (subgraphStack.length > 0) {
        // Add direction as a special property to the subgraph
        subgraphStack[subgraphStack.length - 1].direction = line.split(' ')[1];
        subgraphStack[subgraphStack.length - 1].raw.push(lines[i]);
      } else {
        // Add to header if not in a subgraph
        tree.header.push(lines[i]);
      }
      continue;
    }
    
    // Process nodes and edges
    if (containsLinkSyntax(line)) {
      // Check for chained links (A --> B --> C)
      // This is a simplified approach - a more robust parser would be needed
      const linkProperties = analyzeLinkProperties(line);
      
      const edge = {
        type: 'edge',
        content: line,
        raw: lines[i],
        linkType: linkProperties.type,
        linkText: linkProperties.text,
        isBidirectional: linkProperties.isBidirectional
      };
      
      if (subgraphStack.length > 0) {
        subgraphStack[subgraphStack.length - 1].edges.push(edge);
        subgraphStack[subgraphStack.length - 1].raw.push(lines[i]);
      } else {
        tree.edges.push(edge);
      }
    } else if (line) { // Only process non-empty lines
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
        hasSpecialChars: /[•\u2022\-\*]/.test(line),
        shape: determineNodeShape(line)
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
  
  // Process potential links between subgraphs
  // This would be a more complex implementation in a real parser
  
  return tree;
};

// Export for use in other modules
window.FlowParser = { parse: parseFlow }; 