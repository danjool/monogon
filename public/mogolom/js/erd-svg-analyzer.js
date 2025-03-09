// Find edge-edge intersections in SVG for ER diagrams
function findEdgeEdgeIntersections(svg) {
  if (!svg) return [];
  
  // Get all path elements
  const paths = Array.from(svg.querySelectorAll('path'));
  const erPaths = paths.filter(path => 
    path.classList.contains('er') || 
    path.classList.contains('relationshipLine') || 
    (path.hasAttribute('class') && path.getAttribute('class').includes('er'))
  );
  
  const intersections = [];
  
  // Check each pair of paths for intersections
  for (let i = 0; i < erPaths.length; i++) {
    for (let j = i + 1; j < erPaths.length; j++) {
      const path1 = erPaths[i];
      const path2 = erPaths[j];
      
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

// Find edge-node intersections in SVG for ER diagrams
function findEdgeNodeIntersections(svg) {
  if (!svg) return [];
  
  // Get all path elements (edges)
  const paths = Array.from(svg.querySelectorAll('path'));
  const relationshipPaths = paths.filter(path => 
    path.classList.contains('er') || 
    path.classList.contains('relationshipLine') || 
    (path.hasAttribute('class') && path.getAttribute('class').includes('er')) ||
    (path.hasAttribute('class') && path.getAttribute('class').includes('relation'))
  );
  
  // ONLY get entity rectangles - nothing else
  // This is the most direct way to ensure we're only checking against entity boxes
  const entityRects = Array.from(svg.querySelectorAll('rect.er.entityBox, rect.entityBox'));
  
  const intersections = [];
  
  // Check each path against each entity rect
  for (const path of relationshipPaths) {
    const pathData = path.getAttribute('d') || '';
    const segments = parseSVGPath(pathData);
    
    for (const rect of entityRects) {
      // Skip if this rect is connected to the path (it's supposed to connect to it)
      if (isRectConnectedToPath(rect, path)) {
        continue;
      }
      
      // Get rect dimensions
      const rx = parseFloat(rect.getAttribute('x') || 0);
      const ry = parseFloat(rect.getAttribute('y') || 0);
      const rw = parseFloat(rect.getAttribute('width') || 0);
      const rh = parseFloat(rect.getAttribute('height') || 0);
      
      // Check if any segment intersects with the rect
      let foundIntersection = false;
      for (const segment of segments) {
        if (foundIntersection) break;
        
        const intersection = lineRectIntersection(
          segment.x1, segment.y1, segment.x2, segment.y2,
          rx, ry, rw, rh
        );
        
        if (intersection) {
          intersections.push({
            type: 'edge-node',
            point: intersection,
            path: path,
            node: rect
          });
          
          // Break early to avoid counting multiple intersections between the same path and rect
          foundIntersection = true;
        }
      }
    }
  }
  
  return intersections;
}

// Helper function to check if a rect is connected to a path
function isRectConnectedToPath(rect, path) {
  // Get rect dimensions and center
  const rx = parseFloat(rect.getAttribute('x') || 0);
  const ry = parseFloat(rect.getAttribute('y') || 0);
  const rw = parseFloat(rect.getAttribute('width') || 0);
  const rh = parseFloat(rect.getAttribute('height') || 0);
  
  const rectCenter = {
    x: rx + rw / 2,
    y: ry + rh / 2
  };
  
  // Get path endpoints
  const pathData = path.getAttribute('d') || '';
  const segments = parseSVGPath(pathData);
  
  if (segments.length === 0) return false;
  
  // Check first segment start point
  const startPoint = { x: segments[0].x1, y: segments[0].y1 };
  
  // Check last segment end point
  const lastSegment = segments[segments.length - 1];
  const endPoint = { x: lastSegment.x2, y: lastSegment.y2 };
  
  // Check if either endpoint is near the rect
  const proximityThreshold = 15; // pixels
  
  // Check if point is near rect border
  const isPointNearRect = (point) => {
    // Check if point is inside rect
    if (point.x >= rx && point.x <= rx + rw && 
        point.y >= ry && point.y <= ry + rh) {
      return true;
    }
    
    // Check if point is near rect border
    const isNearHorizontalBorder = 
      (Math.abs(point.y - ry) <= proximityThreshold || 
       Math.abs(point.y - (ry + rh)) <= proximityThreshold) &&
      (point.x >= rx - proximityThreshold && 
       point.x <= rx + rw + proximityThreshold);
    
    const isNearVerticalBorder = 
      (Math.abs(point.x - rx) <= proximityThreshold || 
       Math.abs(point.x - (rx + rw)) <= proximityThreshold) &&
      (point.y >= ry - proximityThreshold && 
       point.y <= ry + rh + proximityThreshold);
    
    return isNearHorizontalBorder || isNearVerticalBorder;
  };
  
  return isPointNearRect(startPoint) || isPointNearRect(endPoint);
}

// Parse SVG path data into line segments
function parseSVGPath(pathData) {
  if (!pathData) return [];
  
  const segments = [];
  const commands = pathData.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g) || [];
  
  let currentX = 0;
  let currentY = 0;
  
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    const type = command[0];
    const args = command.substring(1).trim().split(/[\s,]+/).map(parseFloat);
    
    switch (type) {
      case 'M': // Move to (absolute)
        currentX = args[0];
        currentY = args[1];
        break;
        
      case 'm': // Move to (relative)
        currentX += args[0];
        currentY += args[1];
        break;
        
      case 'L': // Line to (absolute)
        for (let j = 0; j < args.length; j += 2) {
          const x = args[j];
          const y = args[j + 1];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: x,
            y2: y
          });
          
          currentX = x;
          currentY = y;
        }
        break;
        
      case 'l': // Line to (relative)
        for (let j = 0; j < args.length; j += 2) {
          const x = currentX + args[j];
          const y = currentY + args[j + 1];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: x,
            y2: y
          });
          
          currentX = x;
          currentY = y;
        }
        break;
        
      case 'H': // Horizontal line to (absolute)
        for (let j = 0; j < args.length; j++) {
          const x = args[j];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: x,
            y2: currentY
          });
          
          currentX = x;
        }
        break;
        
      case 'h': // Horizontal line to (relative)
        for (let j = 0; j < args.length; j++) {
          const x = currentX + args[j];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: x,
            y2: currentY
          });
          
          currentX = x;
        }
        break;
        
      case 'V': // Vertical line to (absolute)
        for (let j = 0; j < args.length; j++) {
          const y = args[j];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: currentX,
            y2: y
          });
          
          currentY = y;
        }
        break;
        
      case 'v': // Vertical line to (relative)
        for (let j = 0; j < args.length; j++) {
          const y = currentY + args[j];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: currentX,
            y2: y
          });
          
          currentY = y;
        }
        break;
        
      // For curves, we'll approximate with line segments
      case 'C': // Cubic Bezier (absolute)
      case 'c': // Cubic Bezier (relative)
      case 'S': // Smooth cubic Bezier (absolute)
      case 's': // Smooth cubic Bezier (relative)
      case 'Q': // Quadratic Bezier (absolute)
      case 'q': // Quadratic Bezier (relative)
      case 'T': // Smooth quadratic Bezier (absolute)
      case 't': // Smooth quadratic Bezier (relative)
      case 'A': // Arc (absolute)
      case 'a': // Arc (relative)
        // For simplicity, we'll just connect the start and end points
        if (type === 'C' || type === 'S') {
          const x = args[args.length - 2];
          const y = args[args.length - 1];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: x,
            y2: y
          });
          
          currentX = x;
          currentY = y;
        } else if (type === 'c' || type === 's') {
          const x = currentX + args[args.length - 2];
          const y = currentY + args[args.length - 1];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: x,
            y2: y
          });
          
          currentX = x;
          currentY = y;
        } else if (type === 'Q' || type === 'T') {
          const x = args[args.length - 2];
          const y = args[args.length - 1];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: x,
            y2: y
          });
          
          currentX = x;
          currentY = y;
        } else if (type === 'q' || type === 't') {
          const x = currentX + args[args.length - 2];
          const y = currentY + args[args.length - 1];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: x,
            y2: y
          });
          
          currentX = x;
          currentY = y;
        } else if (type === 'A') {
          const x = args[5];
          const y = args[6];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: x,
            y2: y
          });
          
          currentX = x;
          currentY = y;
        } else if (type === 'a') {
          const x = currentX + args[5];
          const y = currentY + args[6];
          
          segments.push({
            x1: currentX,
            y1: currentY,
            x2: x,
            y2: y
          });
          
          currentX = x;
          currentY = y;
        }
        break;
        
      case 'Z': // Close path
      case 'z': // Close path
        // We don't handle close path for simplicity
        break;
    }
  }
  
  return segments;
}

// Find intersection between two line segments
function findIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  // Calculate the denominator
  const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
  
  // If denominator is 0, lines are parallel
  if (denominator === 0) return null;
  
  // Calculate the parameters
  const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
  const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
  
  // Check if the intersection is within both line segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;
  
  // Calculate the intersection point
  const x = x1 + (ua * (x2 - x1));
  const y = y1 + (ua * (y2 - y1));
  
  return { x, y };
}

// Find intersection between a line segment and a rectangle
function lineRectIntersection(x1, y1, x2, y2, rx, ry, rw, rh) {
  // Check if either endpoint is inside the rectangle
  if (pointInRect(x1, y1, rx, ry, rw, rh) || pointInRect(x2, y2, rx, ry, rw, rh)) {
    return null; // Endpoints inside rectangle are not considered intersections
  }
  
  // Check intersection with each edge of the rectangle
  const top = findIntersection(x1, y1, x2, y2, rx, ry, rx + rw, ry);
  const right = findIntersection(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
  const bottom = findIntersection(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);
  const left = findIntersection(x1, y1, x2, y2, rx, ry, rx, ry + rh);
  
  // Return the first intersection found
  return top || right || bottom || left;
}

// Check if a point is inside a rectangle
function pointInRect(x, y, rx, ry, rw, rh) {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

// Export functions for use in other modules
window.SVGAnalyzer = {
  findEdgeEdgeIntersections,
  findEdgeNodeIntersections,
  calculateDiagramScore: function(svg) {
    const edgeIntersections = findEdgeEdgeIntersections(svg);
    const nodeIntersections = findEdgeNodeIntersections(svg);
    const edgeEdgeWeight = 10;
    const edgeNodeWeight = 1;
    return {
      edgeEdgeCount: edgeIntersections.length,
      edgeNodeCount: nodeIntersections.length,
      totalScore: edgeIntersections.length * edgeEdgeWeight + nodeIntersections.length * edgeNodeWeight
    };
  }
}; 