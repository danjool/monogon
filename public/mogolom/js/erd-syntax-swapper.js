// Functions for generating variations of ER diagrams while preserving semantics

// Parse ER diagram structure to identify entities and relationships
function parseERDiagram(code) {
  const lines = code.split('\n');
  const result = {
    header: [],
    entities: {},
    relationships: []
  };
  
  let inEntityBlock = false;
  let currentEntity = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (line === '' || line.startsWith('%%')) {
      result.header.push(lines[i]);
      continue;
    }
    
    // Check for entity block start
    if (line.match(/\w+\s*{/)) {
      inEntityBlock = true;
      currentEntity = line.split('{')[0].trim();
      result.entities[currentEntity] = {
        startLine: i,
        attributes: [],
        blockLines: [lines[i]]
      };
      continue;
    }
    
    // Check for entity block end
    if (inEntityBlock && line === '}') {
      inEntityBlock = false;
      if (currentEntity) {
        result.entities[currentEntity].endLine = i;
        result.entities[currentEntity].blockLines.push(lines[i]);
      }
      currentEntity = null;
      continue;
    }
    
    // Process line
    if (inEntityBlock) {
      if (currentEntity) {
        result.entities[currentEntity].attributes.push(line);
        result.entities[currentEntity].blockLines.push(lines[i]);
      }
    } else {
      // First, try to match standard relationship pattern with symbol notation
      const symbolRelationMatch = line.match(/(\w+[\w-]*)\s+([|o}{\.]+)--([|o}{\.]+)\s+(\w+[\w-]*)\s*(?::(?:\s*"([^"]*)")?\s*|\s*$)/);
      
      if (symbolRelationMatch) {
        const entity1 = symbolRelationMatch[1];
        const cardinality1 = symbolRelationMatch[2];
        const cardinality2 = symbolRelationMatch[3];
        const entity2 = symbolRelationMatch[4];
        const label = symbolRelationMatch[5] || ""; // Use empty string if no label
        
        result.relationships.push({
          lineIndex: i,
          content: lines[i],
          entity1: entity1,
          cardinality1: cardinality1,
          cardinality2: cardinality2,
          entity2: entity2,
          label: label
        });
      } else {
        // Try to match text-based relationship notation
        const textRelationMatch = line.match(/(\w+[\w-]*)\s+(only one|one or zero|zero or one|one or more|one or many|many\(\d+\)|\d+\+|zero or more|zero or many|many\(\d+\)|\d+\+|only one|1)\s+to\s+(only one|one or zero|zero or one|one or more|one or many|many\(\d+\)|\d+\+|zero or more|zero or many|many\(\d+\)|\d+\+|only one|1)\s+(\w+[\w-]*)\s*(?::(?:\s*"([^"]*)")?\s*|\s*$)/);
        
        if (textRelationMatch) {
          result.relationships.push({
            lineIndex: i,
            content: lines[i],
            entity1: textRelationMatch[1],
            entity2: textRelationMatch[4],
            label: textRelationMatch[5] || "",
            isTextNotation: true,
            fullLine: line
          });
        } else {
          // If not a relationship, add to header
          result.header.push(lines[i]);
        }
      }
    }
  }
  
  return result;
}

// Helper function to reverse cardinality notation
function reverseCardinality(cardinality) {
  // Map of cardinality symbols to their reversed counterparts
  const cardinalityMap = {
    '||': '||', // exactly one to exactly one
    '|o': 'o|', // zero or one to one
    'o|': '|o', // one to zero or one
    '|{': '}|', // one or more to one
    '}|': '|{', // one to one or more
    'o{': '}o', // zero or more to one
    '}o': 'o{', // one to zero or more
    '|.': '.|', // non-identifying relationship
    '.|': '|.', // non-identifying relationship
  };
  
  return cardinalityMap[cardinality] || cardinality;
}

// Helper function to reverse text-based cardinality
function reverseTextCardinality(text) {
  // Extract the relationship part from the line
  const match = text.match(/(.*?)(\w+[\w-]*)\s+(only one|one or zero|zero or one|one or more|one or many|many\(\d+\)|\d+\+|zero or more|zero or many|many\(\d+\)|\d+\+|only one|1)\s+to\s+(only one|one or zero|zero or one|one or more|one or many|many\(\d+\)|\d+\+|zero or more|zero or many|many\(\d+\)|\d+\+|only one|1)\s+(\w+[\w-]*)(.*)/);
  
  if (match) {
    const prefix = match[1];
    const entity1 = match[2];
    const card1 = match[3];
    const card2 = match[4];
    const entity2 = match[5];
    const suffix = match[6];
    
    // Swap entities and cardinalities
    return `${prefix}${entity2} ${card2} to ${card1} ${entity1}${suffix}`;
  }
  
  return text; // Return original if pattern not matched
}

// Generate a variation of the diagram by permuting relationships
function generateVariation(code, problematicEdges = []) {
  const parsedData = parseERDiagram(code);
  const lines = code.split('\n');
  const newLines = [...lines];
  
  // Only proceed if we have relationships to work with
  if (parsedData.relationships.length <= 1) {
    return code;
  }
  
  // Strategies for generating variations:
  // 1. Swap two relationship lines (change order)
  // 2. Reverse a relationship (swap entity1 and entity2)
  
  // Determine which strategy to use
  const strategy = Math.random() < 0.5 ? 'swap' : 'reverse';
  
  if (strategy === 'swap' && parsedData.relationships.length >= 2) {
    // Swap two relationship lines
    const idx1 = Math.floor(Math.random() * parsedData.relationships.length);
    let idx2 = Math.floor(Math.random() * parsedData.relationships.length);
    
    // Make sure idx2 is different from idx1
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * parsedData.relationships.length);
    }
    
    // Get the line indices
    const lineIdx1 = parsedData.relationships[idx1].lineIndex;
    const lineIdx2 = parsedData.relationships[idx2].lineIndex;
    
    // Swap the lines
    const temp = newLines[lineIdx1];
    newLines[lineIdx1] = newLines[lineIdx2];
    newLines[lineIdx2] = temp;
  } else {
    // Reverse a relationship (swap entity1 and entity2)
    const idx = Math.floor(Math.random() * parsedData.relationships.length);
    const relationship = parsedData.relationships[idx];
    
    if (relationship.isTextNotation) {
      // Handle text-based notation
      const reversedText = reverseTextCardinality(relationship.fullLine);
      newLines[relationship.lineIndex] = reversedText;
    } else {
      // Create the reversed relationship with symbol notation
      // For ER diagrams, we need to keep the original label rather than trying to reverse it
      // The label is from entity1's perspective, so we'll keep it the same
      const labelPart = relationship.label ? ` : "${relationship.label}"` : '';
      const reversedRelationship = `${relationship.entity2} ${reverseCardinality(relationship.cardinality2)}--${reverseCardinality(relationship.cardinality1)} ${relationship.entity1}${labelPart}`;
      
      // Replace the line
      newLines[relationship.lineIndex] = newLines[relationship.lineIndex].replace(
        relationship.content.trim(),
        reversedRelationship
      );
    }
  }
  
  return newLines.join('\n');
}

// Export functions for use in other modules
window.SyntaxSwapper = {
  parseERDiagram,
  generateVariation
}; 