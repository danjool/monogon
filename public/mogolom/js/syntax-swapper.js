// Functions for generating variations of mermaid diagrams while preserving semantics and subgraph structure

// Parse flowchart structure to identify subgraphs and their contents
function parseFlowchart(code) {
  const lines = code.split('\n');
  const result = {
    header: [],
    mainNodes: [],
    subgraphs: [],
    currentSubgraph: null
  };
  
  let inSubgraph = false;
  let indentLevel = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (trimmedLine === '' || trimmedLine.startsWith('%%')) {
      if (inSubgraph) {
        result.currentSubgraph.lines.push(line);
      } else {
        result.header.push(line);
      }
      continue;
    }
    
    // Check for subgraph start
    if (trimmedLine.startsWith('subgraph')) {
      inSubgraph = true;
      indentLevel = line.match(/^\s*/)[0].length;
      
      result.currentSubgraph = {
        start: i,
        name: trimmedLine.substring(9).trim(),
        lines: [line],
        edges: []
      };
      continue;
    }
    
    // Check for subgraph end
    if (inSubgraph && trimmedLine === 'end') {
      const currentIndent = line.match(/^\s*/)[0].length;
      if (currentIndent === indentLevel) {
        inSubgraph = false;
        result.currentSubgraph.end = i;
        result.currentSubgraph.lines.push(line);
        result.subgraphs.push(result.currentSubgraph);
        result.currentSubgraph = null;
        continue;
      }
    }
    
    // Process line
    if (inSubgraph) {
      result.currentSubgraph.lines.push(line);
      if (trimmedLine.includes('-->')) {
        result.currentSubgraph.edges.push({
          lineIndex: i,
          content: line
        });
      }
    } else {
      result.mainNodes.push({
        lineIndex: i,
        content: line,
        isEdge: trimmedLine.includes('-->')
      });
    }
  }
  
  return result;
}

// Generate a variation of the diagram by permuting elements within their respective scopes
function generateVariation(code, problematicEdges = []) {
  const parsedData = parseFlowchart(code);
  const lines = code.split('\n');
  const newLines = [...lines];
  
  // 1. Only shuffle edges within main graph
  const mainEdges = parsedData.mainNodes
    .filter(node => node.isEdge)
    .map(node => node.lineIndex);
  // 2. Only shuffle edges within the same subgraph, not across subgraphs
  if (mainEdges.length > 1) {
    // Shuffle edges strategy (100% chance)
    const shuffleCount = 1 + Math.floor(Math.random() * 3); // Shuffle 1-3 edges
    
    for (let i = 0; i < shuffleCount; i++) {
      // 50% chance to prioritize problematic edges if available
      if (problematicEdges.length > 0 && Math.random() < .6) {
        // Pick a random problematic edge
        const problemIdx = Math.floor(Math.random() * problematicEdges.length);
        const problemEdge = problematicEdges[problemIdx];
        
        // Find a matching edge in mainEdges if possible
        const matchingEdges = mainEdges.filter(idx => {
          const line = lines[idx].trim();
          return line.includes(problemEdge);
        });
        
        if (matchingEdges.length > 0) {
          // Pick a random matching edge and a random other edge
          const idx1 = matchingEdges[Math.floor(Math.random() * matchingEdges.length)];
          let idx2 = mainEdges[Math.floor(Math.random() * mainEdges.length)];
          
          // Make sure idx2 is different from idx1
          while (mainEdges.indexOf(idx1) === mainEdges.indexOf(idx2)) {
            idx2 = mainEdges[Math.floor(Math.random() * mainEdges.length)];
          }
          
          // Swap the lines
          const temp = newLines[idx1];
          newLines[idx1] = newLines[idx2];
          newLines[idx2] = temp;
          continue;
        }
      }
      
      // Default random swap if no problematic edges or 50% of the time
      const idx1 = Math.floor(Math.random() * mainEdges.length);
      let idx2 = Math.floor(Math.random() * mainEdges.length);
      // Make sure idx2 is different from idx1
      while (idx2 === idx1) {
        idx2 = Math.floor(Math.random() * mainEdges.length);
      }
      
      // Swap the lines
      const temp = newLines[mainEdges[idx1]];
      newLines[mainEdges[idx1]] = newLines[mainEdges[idx2]];
      newLines[mainEdges[idx2]] = temp;
    }
  }
  
  // 3. For each subgraph, optionally shuffle edges within that subgraph only
  parsedData.subgraphs.forEach(subgraph => {
    const subgraphEdges = subgraph.edges.map(edge => edge.lineIndex);
    
    if (subgraphEdges.length > 1 && Math.random() < 0.5) {
      // Shuffle edges within this subgraph
      const shuffleCount = 1 + Math.floor(Math.random() * Math.min(2, subgraphEdges.length)); 
      
      for (let i = 0; i < shuffleCount; i++) {
        // Pick two random edge lines from this subgraph
        const idx1 = Math.floor(Math.random() * subgraphEdges.length);
        let idx2 = Math.floor(Math.random() * subgraphEdges.length);
        // Make sure idx2 is different from idx1
        while (idx2 === idx1) {
          idx2 = Math.floor(Math.random() * subgraphEdges.length);
        }
        
        // Swap the lines
        const temp = newLines[subgraphEdges[idx1]];
        newLines[subgraphEdges[idx1]] = newLines[subgraphEdges[idx2]];
        newLines[subgraphEdges[idx2]] = temp;
      }
    }
  });
  
  return newLines.join('\n');
}

// Export functions for use in other modules
window.SyntaxSwapper = {
  parseFlowchart,
  generateVariation
};