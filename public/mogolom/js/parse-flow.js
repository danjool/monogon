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
    
    // TODO: Similar patterns would be needed for other link types
    
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
  
  // Helper function to break down chain links (A --> B --> C) into individual links (A --> B, B --> C)
  function breakDownChainLinks(line) {
    // Regular expressions to match different link types
    const linkPatterns = [
      { regex: /-->/g, type: 'arrow' },
      { regex: /---/g, type: 'line' },
      { regex: /-\.->/g, type: 'dottedArrow' },
      { regex: /-\.-/g, type: 'dotted' },
      { regex: /==>/g, type: 'thickArrow' },
      { regex: /===/g, type: 'thick' },
      { regex: /~~~/g, type: 'invisible' },
      { regex: /--o/g, type: 'circleEnd' },
      { regex: /--x/g, type: 'crossEnd' },
      { regex: /o--o/g, type: 'circleBoth' },
      { regex: /x--x/g, type: 'crossBoth' }
    ];
    
    // Find all link positions
    let linkPositions = [];
    for (const pattern of linkPatterns) {
      let match;
      while ((match = pattern.regex.exec(line)) !== null) {
        linkPositions.push({
          start: match.index,
          end: match.index + match[0].length,
          type: pattern.type
        });
      }
    }
    
    // Sort link positions by their start position
    linkPositions.sort((a, b) => a.start - b.start);
    
    // If no links or only one link, return the original line as a single edge
    if (linkPositions.length <= 1) {
      return [{
        content: line,
        linkProperties: analyzeLinkProperties(line)
      }];
    }
    
    // Filter out overlapping or consecutive link operators
    // This prevents errors when there are patterns like "-.->-.->" (consecutive link operators)
    const filteredPositions = [];
    for (let i = 0; i < linkPositions.length; i++) {
      // Skip this link if it overlaps with the previous one
      if (i > 0 && linkPositions[i].start < filteredPositions[filteredPositions.length - 1].end) {
        continue;
      }
      
      // Skip this link if it's immediately adjacent to the previous one (no node in between)
      if (i > 0 && linkPositions[i].start === filteredPositions[filteredPositions.length - 1].end) {
        // Merge the two links by extending the previous one
        filteredPositions[filteredPositions.length - 1].end = linkPositions[i].end;
        filteredPositions[filteredPositions.length - 1].type = 'combined';
        continue;
      }
      
      filteredPositions.push(linkPositions[i]);
    }
    
    // If after filtering we only have one link, return the original line
    if (filteredPositions.length <= 1) {
      return [{
        content: line,
        linkProperties: analyzeLinkProperties(line)
      }];
    }
    
    // Extract nodes and create individual links
    const nodes = [];
    
    // Extract first node
    nodes.push(line.substring(0, filteredPositions[0].start).trim());
    
    // Extract middle nodes
    for (let i = 0; i < filteredPositions.length; i++) {
      const linkEnd = filteredPositions[i].end;
      const nextLinkStart = i < filteredPositions.length - 1 ? filteredPositions[i + 1].start : line.length;
      
      // Extract node between links
      const node = line.substring(linkEnd, nextLinkStart).trim();
      if (node) {
        nodes.push(node);
      } else if (i < filteredPositions.length - 1) {
        // If there's no node between links, this is an invalid chain
        // Return the original line instead of trying to break it down
        return [{
          content: line,
          linkProperties: analyzeLinkProperties(line)
        }];
      }
    }
    
    // Create individual links
    const individualLinks = [];
    for (let i = 0; i < filteredPositions.length; i++) {
      if (i < nodes.length - 1) {
        // Extract link text if present
        const linkPart = line.substring(filteredPositions[i].start, filteredPositions[i].end);
        
        // Create the individual link
        const linkContent = `${nodes[i]} ${linkPart} ${nodes[i + 1]}`;
        individualLinks.push({
          content: linkContent,
          linkProperties: analyzeLinkProperties(linkContent)
        });
      }
    }
    
    // If we couldn't create any valid links, return the original line
    if (individualLinks.length === 0) {
      return [{
        content: line,
        linkProperties: analyzeLinkProperties(line)
      }];
    }
    
    return individualLinks;
  }
  
  // Helper function to break down multi-directional links (A & B --> C & D) into individual links
  function breakDownMultiLinks(line) {
    // Check if line contains multi-link syntax with & character
    if (!line.includes('&')) {
      return [{ content: line, linkProperties: analyzeLinkProperties(line) }];
    }
    
    // Find the link operator (-->, ---, etc.)
    let linkOperator = '';
    const operators = ['-->', '---', '-.->','-.-', '==>', '===', '~~~', '--o', '--x', 'o--o', 'x--x'];
    
    // Find the longest matching operator
    let operatorIndex = -1;
    for (const op of operators) {
      const index = line.indexOf(op);
      if (index !== -1 && (operatorIndex === -1 || index < operatorIndex)) {
        linkOperator = op;
        operatorIndex = index;
      }
    }
    
    if (!linkOperator || operatorIndex === -1) {
      return [{ content: line, linkProperties: analyzeLinkProperties(line) }];
    }
    
    // Check if there are multiple operators of the same type (chain links)
    // If so, don't try to break down multi-links, let the chain link function handle it
    if (line.indexOf(linkOperator, operatorIndex + linkOperator.length) !== -1) {
      return [{ content: line, linkProperties: analyzeLinkProperties(line) }];
    }
    
    // Split the line by the link operator
    const parts = line.split(linkOperator);
    if (parts.length !== 2) {
      return [{ content: line, linkProperties: analyzeLinkProperties(line) }];
    }
    
    // Extract source and target nodes
    const sourceNodes = parts[0].split('&').map(node => node.trim()).filter(Boolean);
    const targetNodes = parts[1].split('&').map(node => node.trim()).filter(Boolean);
    
    // If either side has no valid nodes, return the original line
    if (sourceNodes.length === 0 || targetNodes.length === 0) {
      return [{ content: line, linkProperties: analyzeLinkProperties(line) }];
    }
    
    // Create individual links for each combination
    const individualLinks = [];
    for (const source of sourceNodes) {
      for (const target of targetNodes) {
        if (source && target) {  // Ensure both source and target are non-empty
          const linkContent = `${source} ${linkOperator} ${target}`;
          individualLinks.push({
            content: linkContent,
            linkProperties: analyzeLinkProperties(linkContent)
          });
        }
      }
    }
    
    // If we couldn't create any valid links, return the original line
    if (individualLinks.length === 0) {
      return [{ content: line, linkProperties: analyzeLinkProperties(line) }];
    }
    
    return individualLinks;
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

      if (node.shape === 'stadium') {
        console.log('node', node.content, node);
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