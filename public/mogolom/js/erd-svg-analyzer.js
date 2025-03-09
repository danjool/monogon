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
  
  // Get all path elements (edges) - specifically target ER diagram relationship lines
  const paths = Array.from(svg.querySelectorAll('path')).filter(path => 
    path.classList.contains('er') || 
    path.classList.contains('relationshipLine') || 
    (path.hasAttribute('class') && path.getAttribute('class').includes('er')) ||
    // Additional selectors for Mermaid ER diagram relationship lines
    (path.hasAttribute('class') && path.getAttribute('class').includes('relation'))
  );
  
  // Skip paths that are part of markers or arrowheads
  const filteredPaths = paths.filter(path => {
    const parent = path.parentElement;
    return !(parent && (
      parent.tagName.toLowerCase() === 'marker' || 
      (parent.hasAttribute('class') && parent.getAttribute('class').includes('marker'))
    ));
  });
  
  // Get all node elements - in ER diagrams, these are typically rect or g.er.entityBox elements
  const nodes = Array.from(svg.querySelectorAll('.er.entityBox, .er.attributeBox, rect.er, .entityBox, .entity'));
  
  const intersections = [];
  
  // Check each path against each node
  for (const path of filteredPaths) {
    const pathData = path.getAttribute('d') || '';
    const segments = parseSVGPath(pathData);
    
    // Find the entities this path connects
    const connectedEntities = findConnectedEntities(path, svg);
    
    for (const node of nodes) {
      // Skip if this node is one of the entities the path is supposed to connect
      if (connectedEntities.includes(node)) {
        continue;
      }
      
      // Get node bounding box
      const nodeBBox = node.getBBox();
      const nodeRect = {
        x: nodeBBox.x,
        y: nodeBBox.y,
        width: nodeBBox.width,
        height: nodeBBox.height
      };
      
      // Check if any segment intersects with the node
      let foundIntersection = false;
      for (const segment of segments) {
        if (foundIntersection) break;
        
        const intersection = lineRectIntersection(
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
          
          // Break early to avoid counting multiple intersections between the same path and node
          foundIntersection = true;
        }
      }
    }
  }
  
  return intersections;
}

// Helper function to find entities connected by a path
function findConnectedEntities(path, svg) {
  const connectedEntities = [];
  
  // Get all entity nodes
  const entities = Array.from(svg.querySelectorAll('.er.entityBox, .entityBox, .entity'));
  
  // For each entity, check if the path starts or ends near it
  for (const entity of entities) {
    const entityBBox = entity.getBBox();
    const entityCenter = {
      x: entityBBox.x + entityBBox.width / 2,
      y: entityBBox.y + entityBBox.height / 2
    };
    
    // Get path endpoints
    const pathData = path.getAttribute('d') || '';
    const segments = parseSVGPath(pathData);
    
    if (segments.length > 0) {
      // Check first segment start point
      const startPoint = { x: segments[0].x1, y: segments[0].y1 };
      const distanceToStart = Math.sqrt(
        Math.pow(entityCenter.x - startPoint.x, 2) + 
        Math.pow(entityCenter.y - startPoint.y, 2)
      );
      
      // Check last segment end point
      const lastSegment = segments[segments.length - 1];
      const endPoint = { x: lastSegment.x2, y: lastSegment.y2 };
      const distanceToEnd = Math.sqrt(
        Math.pow(entityCenter.x - endPoint.x, 2) + 
        Math.pow(entityCenter.y - endPoint.y, 2)
      );
      
      // If either endpoint is close to the entity center or within the entity bounds,
      // consider this entity connected to the path
      const proximityThreshold = Math.max(entityBBox.width, entityBBox.height) / 2 + 10; // Add some margin
      
      if (distanceToStart < proximityThreshold || distanceToEnd < proximityThreshold ||
          pointInRect(startPoint.x, startPoint.y, entityBBox.x, entityBBox.y, entityBBox.width, entityBBox.height) ||
          pointInRect(endPoint.x, endPoint.y, entityBBox.x, entityBBox.y, entityBBox.width, entityBBox.height)) {
        connectedEntities.push(entity);
      }
    }
  }
  
  return connectedEntities;
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
  findEdgeNodeIntersections
}; 