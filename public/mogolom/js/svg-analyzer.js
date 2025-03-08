// Find edge-edge intersections in SVG
function findEdgeEdgeIntersections(svg) {
  if (!svg) return [];
  
  // Get all path elements
  const paths = Array.from(svg.querySelectorAll('path'));
  const flowchartPaths = paths.filter(path => 
    path.classList.contains('flowchart-link') || 
    (path.hasAttribute('class') && path.getAttribute('class').includes('flowchart'))
  );
  
  const intersections = [];
  
  // Check each pair of paths for intersections
  for (let i = 0; i < flowchartPaths.length; i++) {
    for (let j = i + 1; j < flowchartPaths.length; j++) {
      const path1 = flowchartPaths[i];
      const path2 = flowchartPaths[j];
      
      const path1Id = path1.id || `path-${i}`;
      const path2Id = path2.id || `path-${j}`;
      
      const path1Data = path1.getAttribute('d');
      const path2Data = path2.getAttribute('d');
      
      // Convert path data to line segments
      const segments1 = parseSVGPath(path1Data);
      const segments2 = parseSVGPath(path2Data);
      
      // Check for intersections between segments
      let foundIntersection = false;
      
      for (const seg1 of segments1) {
        if (foundIntersection) break;
        
        for (const seg2 of segments2) {
          const intersection = findIntersection(
            seg1.x1, seg1.y1, seg1.x2, seg1.y2,
            seg2.x1, seg2.y1, seg2.x2, seg2.y2
          );
          
          if (intersection) {
            intersections.push({
              type: 'edge-edge',
              point: intersection,
              paths: [path1, path2]
            });
            
            // Break early to avoid counting multiple intersections between the same paths
            foundIntersection = true;
            break;
          }
        }
      }
    }
  }
  
  return intersections;
}

// Find edge-node intersections in SVG
function findEdgeNodeIntersections(svg) {
  if (!svg) return [];
  
  // Get all path elements (edges)
  const paths = Array.from(svg.querySelectorAll('path')).filter(path => 
    path.classList.contains('flowchart-link') || 
    (path.hasAttribute('class') && path.getAttribute('class').includes('flowchart'))
  );
  
  // Get all node elements
  const nodes = Array.from(svg.querySelectorAll('.node, [data-node="true"], .default.flowchart-label'));
  
  const intersections = [];
  
  // Check each path against each node
  for (const path of paths) {
    const pathData = path.getAttribute('d') || '';
    const segments = parseSVGPath(pathData);
    
    // Get source and target nodes for this path
    const pathId = path.id || '';
    const pathClass = path.getAttribute('class') || '';
    const sourceNodeIds = [];
    const targetNodeIds = [];
    
    // Try to extract from ID (L-SOURCE-TARGET-N format)
    if (pathId.startsWith('L-')) {
      const parts = pathId.substring(2).split('-');
      if (parts.length >= 2) {
        const sourceId = parts[0];
        const targetId = parts[1];
        
        // Add all possible node ID formats
        sourceNodeIds.push(
          `flowchart-${sourceId}`,
          `${sourceId}`,
          `flowchart-${sourceId}-node`
        );
        
        targetNodeIds.push(
          `flowchart-${targetId}`,
          `${targetId}`,
          `flowchart-${targetId}-node`
        );
      }
    }
    
    // Also extract from class (LS-SOURCE LE-TARGET format)
    const classMatch = pathClass.match(/LS-(\w+)\s+LE-(\w+)/);
    if (classMatch && classMatch.length >= 3) {
      sourceNodeIds.push(
        `flowchart-${classMatch[1]}`,
        `${classMatch[1]}`
      );
      
      targetNodeIds.push(
        `flowchart-${classMatch[2]}`,
        `${classMatch[2]}`
      );
    }
    
    // Check each node for intersection with this edge
    for (const node of nodes) {
      const nodeId = node.id || '';
      
      // Skip if node is source or target
      if (sourceNodeIds.includes(nodeId) || targetNodeIds.includes(nodeId)) {
        continue;
      }
      
      // For data-id nodes (flowchart-label format)
      const nodeDataId = node.getAttribute('data-id');
      if (nodeDataId && (sourceNodeIds.includes(nodeDataId) || targetNodeIds.includes(nodeDataId))) {
        continue;
      }
      
      // Get node bounding box
      const nodeBox = node.getBBox ? node.getBBox() : 
                    {x: parseFloat(node.getAttribute('x') || 0),
                     y: parseFloat(node.getAttribute('y') || 0),
                     width: parseFloat(node.getAttribute('width') || 0),
                     height: parseFloat(node.getAttribute('height') || 0)};
      
      // Handle transform if it exists
      let transform = {x: 0, y: 0};
      if (node.getAttribute('transform')) {
        const transformMatch = node.getAttribute('transform').match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (transformMatch && transformMatch.length >= 3) {
          transform.x = parseFloat(transformMatch[1]);
          transform.y = parseFloat(transformMatch[2]);
        }
      }
      
      const nodeRect = {
        x: nodeBox.x + transform.x,
        y: nodeBox.y + transform.y,
        width: nodeBox.width,
        height: nodeBox.height
      };
      
      // Check if any segment intersects with the node
      for (const segment of segments) {
        // Skip very short segments
        const segmentLength = Math.sqrt(
          Math.pow(segment.x2 - segment.x1, 2) + 
          Math.pow(segment.y2 - segment.y1, 2)
        );
        if (segmentLength < 5) continue;
        
        // Check intersections with the four sides of the node rectangle
        const intersectLeft = findIntersection(
          segment.x1, segment.y1, segment.x2, segment.y2,
          nodeRect.x, nodeRect.y, nodeRect.x, nodeRect.y + nodeRect.height
        );
        
        const intersectRight = findIntersection(
          segment.x1, segment.y1, segment.x2, segment.y2,
          nodeRect.x + nodeRect.width, nodeRect.y, 
          nodeRect.x + nodeRect.width, nodeRect.y + nodeRect.height
        );
        
        const intersectTop = findIntersection(
          segment.x1, segment.y1, segment.x2, segment.y2,
          nodeRect.x, nodeRect.y, 
          nodeRect.x + nodeRect.width, nodeRect.y
        );
        
        const intersectBottom = findIntersection(
          segment.x1, segment.y1, segment.x2, segment.y2,
          nodeRect.x, nodeRect.y + nodeRect.height, 
          nodeRect.x + nodeRect.width, nodeRect.y + nodeRect.height
        );
        
        // Use the first intersection found
        const intersection = intersectLeft || intersectRight || intersectTop || intersectBottom;
        
        if (intersection) {
          intersections.push({
            type: 'edge-node',
            point: intersection,
            path: path,
            node: node
          });
          break; // One intersection per edge-node pair is enough
        }
      }
    }
  }
  
  return intersections;
}

// Parse SVG path data into line segments
function parseSVGPath(pathData) {
  if (!pathData) return [];
  
  const segments = [];
  const commands = pathData.match(/([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g) || [];
  
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  
  for (const cmd of commands) {
    const type = cmd.charAt(0);
    const args = cmd.substring(1).trim().split(/[\s,]+/).map(parseFloat);
    
    switch (type) {
      case 'M':
        currentX = args[0];
        currentY = args[1];
        startX = currentX;
        startY = currentY;
        break;
        
      case 'm':
        currentX += args[0];
        currentY += args[1];
        startX = currentX;
        startY = currentY;
        break;
        
      case 'L':
        segments.push({
          x1: currentX,
          y1: currentY,
          x2: args[0],
          y2: args[1]
        });
        currentX = args[0];
        currentY = args[1];
        break;
        
      case 'l':
        segments.push({
          x1: currentX,
          y1: currentY,
          x2: currentX + args[0],
          y2: currentY + args[1]
        });
        currentX += args[0];
        currentY += args[1];
        break;
        
      case 'H':
        segments.push({
          x1: currentX,
          y1: currentY,
          x2: args[0],
          y2: currentY
        });
        currentX = args[0];
        break;
        
      case 'h':
        segments.push({
          x1: currentX,
          y1: currentY,
          x2: currentX + args[0],
          y2: currentY
        });
        currentX += args[0];
        break;
        
      case 'V':
        segments.push({
          x1: currentX,
          y1: currentY,
          x2: currentX,
          y2: args[0]
        });
        currentY = args[0];
        break;
        
      case 'v':
        segments.push({
          x1: currentX,
          y1: currentY,
          x2: currentX,
          y2: currentY + args[0]
        });
        currentY += args[0];
        break;
        
      case 'Z':
      case 'z':
        segments.push({
          x1: currentX,
          y1: currentY,
          x2: startX,
          y2: startY
        });
        currentX = startX;
        currentY = startY;
        break;
        
      case 'C': // Cubic Bezier curve
        if (args.length >= 6) {
          const x1 = currentX;
          const y1 = currentY;
          const cx1 = args[0];
          const cy1 = args[1];
          const cx2 = args[2];
          const cy2 = args[3];
          const x2 = args[4];
          const y2 = args[5];
          
          // Approximate the curve with line segments
          const numSegments = 10;
          for (let t = 0; t < numSegments; t++) {
            const t1 = t / numSegments;
            const t2 = (t + 1) / numSegments;
            
            const p1 = bezierPoint(t1, x1, cx1, cx2, x2, y1, cy1, cy2, y2);
            const p2 = bezierPoint(t2, x1, cx1, cx2, x2, y1, cy1, cy2, y2);
            
            segments.push({
              x1: p1.x,
              y1: p1.y,
              x2: p2.x,
              y2: p2.y
            });
          }
          
          currentX = x2;
          currentY = y2;
        }
        break;
    }
  }
  
  return segments;
}

// Helper function for bezier curve approximation
function bezierPoint(t, x1, x2, x3, x4, y1, y2, y3, y4) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  
  const x = uuu * x1 + 3 * uu * t * x2 + 3 * u * tt * x3 + ttt * x4;
  const y = uuu * y1 + 3 * uu * t * y2 + 3 * u * tt * y3 + ttt * y4;
  
  return { x, y };
}

// Find intersection between two line segments
function findIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  // Calculate the denominator
  const d1x = x2 - x1;
  const d1y = y2 - y1;
  const d2x = x4 - x3;
  const d2y = y4 - y3;
  
  const det = d1x * d2y - d1y * d2x;
  
  // If det is zero, lines are parallel
  if (Math.abs(det) < 1e-10) return null;
  
  // Calculate the parameters
  const dx = x3 - x1;
  const dy = y3 - y1;
  
  const t = (dx * d2y - dy * d2x) / det;
  const u = (dx * d1y - dy * d1x) / det;
  
  // Check if the intersection is within both line segments
  // Using a small epsilon to avoid floating point precision issues
  const epsilon = 1e-6;
  if (t >= -epsilon && t <= 1 + epsilon && u >= -epsilon && u <= 1 + epsilon) {
    return {
      x: x1 + t * d1x,
      y: y1 + t * d1y
    };
  }
  
  return null;
}

// Calculate the score for a diagram based on intersections
function calculateDiagramScore(svg) {
  if (!svg) return { edgeIntersections: [], nodeIntersections: [], totalScore: Infinity };
  
  const edgeIntersections = findEdgeEdgeIntersections(svg);
  const nodeIntersections = findEdgeNodeIntersections(svg);
  const edgeEdgeWeight = parseFloat(document.getElementById('edge-edge-weight').value) || 10;
  const edgeNodeWeight = parseFloat(document.getElementById('edge-node-weight').value) || 1;
  
  const totalScore = edgeIntersections.length * edgeEdgeWeight + 
    nodeIntersections.length * edgeNodeWeight;
  
  return {
    edgeIntersections,
    nodeIntersections,
    totalScore
  };
}

// Export functions for use in other modules
window.SVGAnalyzer = {
  findEdgeEdgeIntersections,
  findEdgeNodeIntersections,
  calculateDiagramScore
}; 