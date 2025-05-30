// Find edge-edge intersections in SVG
function findEdgeEdgeIntersections(svg) {
  if (!svg) return [];
  
  // Helper function to check if a path is invisible
  const isInvisible = (path) => {
    // Check style attribute for stroke-width: 0
    const style = path.getAttribute('style') || '';
    if (style.includes('stroke-width: 0')) {
      
      return true;
    }
    
    // Check for ~~~ in raw data which indicates our invisible edges
    const pathData = path.getAttribute('d') || '';
    const pathId = path.getAttribute('id') || '';
    const pathClass = path.getAttribute('class') || '';
    if (pathData.includes('~~~') || pathId.includes('~~~') || pathClass.includes('~~~')) {
      
      return true;
    }
    
    // Check for other invisibility indicators
    if (style.includes('visibility: hidden') || style.includes('display: none')) {
      
      return true;
    }
    
    // Check computed style as fallback
    const computedStyle = window.getComputedStyle(path);
    if (computedStyle.strokeWidth === '0px' || 
        computedStyle.visibility === 'hidden' || 
        computedStyle.display === 'none') {
      
      return true;
    }
    
    return false;
  };
  
  // Get all path elements
  const paths = Array.from(svg.querySelectorAll('path'));
  const flowchartPaths = paths.filter(path => 
    (path.classList.contains('flowchart-link') || 
    path.classList.contains('flowchart') || 
    (path.hasAttribute('class') && path.getAttribute('class').includes('flowchart'))) &&
    !isInvisible(path) // Filter out invisible paths
  );
  
  const intersections = [];
  
  // Check each pair of paths for intersections
  for (let i = 0; i < flowchartPaths.length; i++) {
    for (let j = i + 1; j < flowchartPaths.length; j++) {
      const path1 = flowchartPaths[i];
      const path2 = flowchartPaths[j];
      
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
  
  // Helper function to check if a path is invisible (reused from above)
  const isInvisible = (path) => {
    // Check style attribute for stroke-width: 0
    const style = path.getAttribute('style') || '';
    if (style.includes('stroke-width: 0')) {
      
      return true;
    }
    
    // Check for ~~~ in raw data which indicates our invisible edges
    const pathData = path.getAttribute('d') || '';
    const pathId = path.getAttribute('id') || '';
    const pathClass = path.getAttribute('class') || '';
    if (pathData.includes('~~~') || pathId.includes('~~~') || pathClass.includes('~~~')) {
      
      return true;
    }
    
    // Check for other invisibility indicators
    if (style.includes('visibility: hidden') || style.includes('display: none')) {
      
      return true;
    }
    
    // Check computed style as fallback
    const computedStyle = window.getComputedStyle(path);
    if (computedStyle.strokeWidth === '0px' || 
        computedStyle.visibility === 'hidden' || 
        computedStyle.display === 'none') {
      
      return true;
    }
    
    return false;
  };
  
  // Get all path elements (edges)
  const paths = Array.from(svg.querySelectorAll('path')).filter(path => 
    (path.classList.contains('flowchart-link') || 
    path.classList.contains('flowchart') || 
    (path.hasAttribute('class') && path.getAttribute('class').includes('flowchart'))) &&
    !isInvisible(path) // Filter out invisible paths
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
      
      // Get node bounding box with improved transform handling
      let nodeRect;
      
      // Try to use getBBox first for most accurate results
      if (node.getBBox) {
        const bbox = node.getBBox();
        nodeRect = {
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height
        };
        
        // Handle transform if it exists
        if (node.getAttribute('transform')) {
          // First try to get the transform from the node directly
          const transformStr = node.getAttribute('transform');
          
          // Handle translate transform
          const translateMatch = transformStr.match(/translate\(([^,]+),\s*([^)]+)\)/);
          if (translateMatch && translateMatch.length >= 3) {
            nodeRect.x += parseFloat(translateMatch[1]);
            nodeRect.y += parseFloat(translateMatch[2]);
          }
          
          // Handle matrix transform (more complex)
          const matrixMatch = transformStr.match(/matrix\(([\d\.\-]+),\s*([\d\.\-]+),\s*([\d\.\-]+),\s*([\d\.\-]+),\s*([\d\.\-]+),\s*([\d\.\-]+)\)/);
          if (matrixMatch && matrixMatch.length >= 7) {
            // Extract matrix values
            const a = parseFloat(matrixMatch[1]);
            const b = parseFloat(matrixMatch[2]);
            const c = parseFloat(matrixMatch[3]);
            const d = parseFloat(matrixMatch[4]);
            const e = parseFloat(matrixMatch[5]);
            const f = parseFloat(matrixMatch[6]);
            
            // Apply matrix transform to the bounding box
            // This is a simplified approach - for complex transforms, 
            // we'd need to transform all corners and recalculate the bounding box
            nodeRect.x += e;
            nodeRect.y += f;
            
            // Scale the width and height if there's scaling in the matrix
            if (a !== 1 || d !== 1) {
              // Approximate scaling - this is simplified
              nodeRect.width *= Math.abs(a);
              nodeRect.height *= Math.abs(d);
            }
          }
        }
      } else {
        // Fallback to attribute-based calculation
        const x = parseFloat(node.getAttribute('x') || 0);
        const y = parseFloat(node.getAttribute('y') || 0);
        const width = parseFloat(node.getAttribute('width') || 0);
        const height = parseFloat(node.getAttribute('height') || 0);
        
        nodeRect = { x, y, width, height };
        
        // Check for transform on parent elements
        let parent = node.parentElement;
        let parentTransform = { x: 0, y: 0 };
        
        while (parent && parent !== svg) {
          if (parent.getAttribute('transform')) {
            const transformStr = parent.getAttribute('transform');
            const translateMatch = transformStr.match(/translate\(([^,]+),\s*([^)]+)\)/);
            
            if (translateMatch && translateMatch.length >= 3) {
              parentTransform.x += parseFloat(translateMatch[1]);
              parentTransform.y += parseFloat(translateMatch[2]);
            }
          }
          parent = parent.parentElement;
        }
        
        // Apply parent transforms
        nodeRect.x += parentTransform.x;
        nodeRect.y += parentTransform.y;
      }
      
      // Add a small buffer to the rectangle to catch near-misses
      // This helps with edges that might just barely miss the rectangle
      const buffer = 1; // 1px buffer
      nodeRect.x -= buffer;
      nodeRect.y -= buffer;
      nodeRect.width += buffer * 2;
      nodeRect.height += buffer * 2;
      
      // Check if any segment intersects with the node
      for (const segment of segments) {
        // Skip very short segments
        const segmentLength = Math.sqrt(
          Math.pow(segment.x2 - segment.x1, 2) + 
          Math.pow(segment.y2 - segment.y1, 2)
        );
        if (segmentLength < 5) continue;
        
        const intersection = checkLineRectIntersection(
          segment.x1, segment.y1, segment.x2, segment.y2,
          nodeRect.x, nodeRect.y, nodeRect.width, nodeRect.height
        );
        
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

// Check if a line segment intersects with a rectangle
function checkLineRectIntersection(x1, y1, x2, y2, rx, ry, rw, rh) {
  // Create an array to store all intersection points
  const intersections = [];
  
  // Check intersection with each edge of the rectangle
  const edges = [
    { x1: rx, y1: ry, x2: rx + rw, y2: ry },           // top
    { x1: rx + rw, y1: ry, x2: rx + rw, y2: ry + rh }, // right
    { x1: rx, y1: ry + rh, x2: rx + rw, y2: ry + rh }, // bottom
    { x1: rx, y1: ry, x2: rx, y2: ry + rh }            // left
  ];
  
  for (const edge of edges) {
    const intersection = findIntersection(
      x1, y1, x2, y2,
      edge.x1, edge.y1, edge.x2, edge.y2
    );
    
    if (intersection) {
      intersections.push(intersection);
    }
  }
  
  // If we found any intersections, return the one closest to the first point of the line segment
  if (intersections.length > 0) {
    if (intersections.length === 1) {
      return intersections[0];
    }
    
    // Find the closest intersection to the first point
    let closestDist = Infinity;
    let closestIntersection = null;
    
    for (const intersection of intersections) {
      const dist = Math.sqrt(
        Math.pow(intersection.x - x1, 2) + 
        Math.pow(intersection.y - y1, 2)
      );
      
      if (dist < closestDist) {
        closestDist = dist;
        closestIntersection = intersection;
      }
    }
    
    return closestIntersection;
  }
  
  // If no edge intersections, check if either endpoint is inside the rectangle
  // This handles the case where a line segment is completely inside the rectangle
  if (isPointInRect({ x: x1, y: y1 }, { x: rx, y: ry, width: rw, height: rh })) {
    // Find the closest edge to this point
    let closestEdge = null;
    let minDist = Infinity;
    
    const distToTop = Math.abs(y1 - ry);
    const distToBottom = Math.abs(y1 - (ry + rh));
    const distToLeft = Math.abs(x1 - rx);
    const distToRight = Math.abs(x1 - (rx + rw));
    
    if (distToTop < minDist) {
      minDist = distToTop;
      closestEdge = { x: x1, y: ry };
    }
    if (distToBottom < minDist) {
      minDist = distToBottom;
      closestEdge = { x: x1, y: ry + rh };
    }
    if (distToLeft < minDist) {
      minDist = distToLeft;
      closestEdge = { x: rx, y: y1 };
    }
    if (distToRight < minDist) {
      minDist = distToRight;
      closestEdge = { x: rx + rw, y: y1 };
    }
    
    return closestEdge;
  }
  
  if (isPointInRect({ x: x2, y: y2 }, { x: rx, y: ry, width: rw, height: rh })) {
    // Find the closest edge to this point
    let closestEdge = null;
    let minDist = Infinity;
    
    const distToTop = Math.abs(y2 - ry);
    const distToBottom = Math.abs(y2 - (ry + rh));
    const distToLeft = Math.abs(x2 - rx);
    const distToRight = Math.abs(x2 - (rx + rw));
    
    if (distToTop < minDist) {
      minDist = distToTop;
      closestEdge = { x: x2, y: ry };
    }
    if (distToBottom < minDist) {
      minDist = distToBottom;
      closestEdge = { x: x2, y: ry + rh };
    }
    if (distToLeft < minDist) {
      minDist = distToLeft;
      closestEdge = { x: rx, y: y2 };
    }
    if (distToRight < minDist) {
      minDist = distToRight;
      closestEdge = { x: rx + rw, y: y2 };
    }
    
    return closestEdge;
  }
  
  return null;
}

// Check if a point is inside a rectangle
function isPointInRect(point, rect) {
  return point.x >= rect.x && 
         point.x <= rect.x + rect.width && 
         point.y >= rect.y && 
         point.y <= rect.y + rect.height;
}

// Calculate the score for a diagram based on multiple factors
function calculateDiagramScore(svg) {
  if (!svg) return { metrics: null, edgeIntersections: [], nodeIntersections: [], totalScore: Infinity };
  
  // Collect all metrics including intersections
  const edgeIntersections = findEdgeEdgeIntersections(svg);
  const nodeIntersections = findEdgeNodeIntersections(svg);
  const metrics = collectDiagramMetrics(svg);
  
  // Get weights from UI or use defaults
  const weights = {
    edgeEdge: parseFloat(document.getElementById('edge-edge-weight')?.value) || 32,
    edgeNode: parseFloat(document.getElementById('edge-node-weight')?.value) || 8,
    diagramArea: parseFloat(document.getElementById('area-weight')?.value) || 0.0001,
    edgeLength: parseFloat(document.getElementById('edge-length-weight')?.value) || 0.0005,
    maxEdgeLength: parseFloat(document.getElementById('max-edge-weight')?.value) || 0.01,
    curveCount: parseFloat(document.getElementById('curve-weight')?.value) || 0.5,
    rectArea: parseFloat(document.getElementById('rect-area-weight')?.value) || 0.0002
  };
  
  // Calculate component scores
  const scores = {
    edgeEdge: edgeIntersections.length * weights.edgeEdge,
    edgeNode: nodeIntersections.length * weights.edgeNode,
    diagramArea: metrics.dimensions.area * weights.diagramArea,
    edgeLength: metrics.pathLengths.total * weights.edgeLength,
    maxEdgeLength: (metrics.pathLengths.longest[0]?.length || 0) * weights.maxEdgeLength,
    curveCount: metrics.edges.curves * weights.curveCount,
    rectArea: metrics.rectArea * weights.rectArea
  };
  
  // Calculate total score
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  // Add intersection and score data to metrics
  metrics.intersections = {
    edgeEdge: {
      count: edgeIntersections.length,
      items: edgeIntersections,
      weight: weights.edgeEdge,
      score: scores.edgeEdge
    },
    edgeNode: {
      count: nodeIntersections.length,
      items: nodeIntersections,
      weight: weights.edgeNode,
      score: scores.edgeNode
    }
  };
  
  metrics.scores = scores;
  metrics.weights = weights;
  metrics.totalScore = totalScore;
  
  return {
    metrics,
    edgeIntersections,
    nodeIntersections,
    totalScore
  };
}

// Collects comprehensive diagram metrics
function collectDiagramMetrics(svg) {
  if (!svg) return null;
  
  // Get diagram dimensions
  const width = parseFloat(svg.getAttribute('width') || (svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal.width : 0));
  const height = parseFloat(svg.getAttribute('height') || (svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal.height : 0));
  
  // Count nodes (rect, circle, etc.)
  const nodes = svg.querySelectorAll('rect, circle, ellipse, polygon, path.node');
  const nodeCount = nodes.length;
  
  // Calculate sum area of all rects
  const rects = svg.querySelectorAll('rect');
  let totalRectArea = 0;
  rects.forEach(rect => {
    const rectWidth = parseFloat(rect.getAttribute('width') || 0);
    const rectHeight = parseFloat(rect.getAttribute('height') || 0);
    totalRectArea += rectWidth * rectHeight;
  });
  
  // Get all paths that represent edges
  const allPaths = Array.from(svg.querySelectorAll('path')).filter(path => {
    // Filter out paths that are part of markers or nodes
    return !path.classList.contains('node') && 
           !path.closest('marker') &&
           !path.classList.contains('edge-edge-marker') &&
           !path.classList.contains('edge-node-marker');
  });
  
  // Count normal edges
  const visibleEdges = allPaths.filter(path => {
    return !path.getAttribute('stroke-dasharray') || 
           !path.getAttribute('stroke-dasharray').includes('0');
  });
  
  // Count invisible edges (~~~)
  const invisibleEdges = allPaths.filter(path => {
    return path.getAttribute('stroke-dasharray') && 
           path.getAttribute('stroke-dasharray').includes('0');
  });
  
  // Count curves in paths
  let curveCount = 0;
  allPaths.forEach(path => {
    const pathData = path.getAttribute('d') || '';
    // Count C, c, S, s, Q, q, T, t, A, a commands which represent curves
    const curveMatches = pathData.match(/[CcSsQqTtAa]/g);
    if (curveMatches) {
      curveCount += curveMatches.length;
    }
  });
  
  // Calculate total length of all edge paths
  let totalPathLength = 0;
  const pathLengths = [];
  
  allPaths.forEach(path => {
    const length = path.getTotalLength ? path.getTotalLength() : 0;
    totalPathLength += length;
    
    if (length > 0) {
      pathLengths.push({
        id: path.id || '',
        length: length,
        path: path
      });
    }
  });
  
  // Sort paths by length (descending)
  pathLengths.sort((a, b) => b.length - a.length);
  
  // Take top 5 longest paths
  const longestPaths = pathLengths.slice(0, 5);
  
  return {
    dimensions: { width, height, area: width * height },
    nodes: nodeCount,
    rectArea: totalRectArea,
    edges: {
      total: allPaths.length,
      visible: visibleEdges.length,
      invisible: invisibleEdges.length,
      curves: curveCount
    },
    pathLengths: {
      total: totalPathLength,
      average: allPaths.length ? totalPathLength / allPaths.length : 0,
      longest: longestPaths
    }
  };
}

// Export functions for use in other modules
window.SVGAnalyzer = {
  findEdgeEdgeIntersections,
  findEdgeNodeIntersections,
  calculateDiagramScore,
  collectDiagramMetrics
};
