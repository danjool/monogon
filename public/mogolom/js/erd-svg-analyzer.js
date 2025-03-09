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
  
  // Get all relationship paths
  const relationshipPaths = Array.from(svg.querySelectorAll('path.er.relationshipLine, path.relationshipLine, path[class*="er"]'));
  
  // Get all entity groups
  const entityGroups = Array.from(svg.querySelectorAll('g[id^="entity-"]'));
  
  const intersections = [];
  
  // For each path, check intersections with each entity
  for (const path of relationshipPaths) {
    // Get the entities this path connects (should be 2 for a relationship)
    const connectedEntityIds = getConnectedEntityIds(path);
    
    // Convert path to absolute coordinates
    const pathSegments = getAbsolutePathSegments(path);
    
    // Check each entity for intersections
    for (const entityGroup of entityGroups) {
      // Skip if this entity is one of the connected entities
      const entityId = entityGroup.id;
      if (connectedEntityIds.includes(entityId)) {
        continue;
      }
      
      // Get the entity's rectangle
      const entityRect = entityGroup.querySelector('rect');
      if (!entityRect) continue;
      
      // Get entity rect in absolute coordinates
      const absoluteRect = getAbsoluteRectCoordinates(entityRect, entityGroup);
      
      // Check for intersections between path segments and entity rect
      for (const segment of pathSegments) {
        const intersection = checkLineRectIntersection(
          segment.x1, segment.y1, segment.x2, segment.y2,
          absoluteRect.x, absoluteRect.y, absoluteRect.width, absoluteRect.height
        );
        
        if (intersection) {
          intersections.push({
            type: 'edge-node',
            point: intersection,
            path: path,
            node: entityGroup
          });
          
          // Only count one intersection per entity-path pair
          break;
        }
      }
    }
  }
  
  return intersections;
}

// Get the IDs of entities connected by a relationship path
function getConnectedEntityIds(path) {
  // Try to extract entity IDs from the path's ID or class
  const pathId = path.id || '';
  const pathClass = path.getAttribute('class') || '';
  
  // In Mermaid ER diagrams, relationship paths often have IDs or classes that include the connected entity IDs
  // Example: "path-Entity1-Entity2" or similar patterns
  
  // First, try to extract from data attributes if available
  const sourceId = path.getAttribute('data-source-entity');
  const targetId = path.getAttribute('data-target-entity');
  
  if (sourceId && targetId) {
    return [`entity-${sourceId}`, `entity-${targetId}`];
  }
  
  // If data attributes aren't available, we need to analyze the path geometry
  // Get the start and end points of the path
  const d = path.getAttribute('d') || '';
  const segments = parseSVGPath(d);
  
  if (segments.length === 0) return [];
  
  const startPoint = { x: segments[0].x1, y: segments[0].y1 };
  const lastSegment = segments[segments.length - 1];
  const endPoint = { x: lastSegment.x2, y: lastSegment.y2 };
  
  // Find entities near these points
  const connectedIds = [];
  
  // Get all entity groups
  const entityGroups = Array.from(path.ownerSVGElement.querySelectorAll('g[id^="entity-"]'));
  
  for (const group of entityGroups) {
    const rect = group.querySelector('rect');
    if (!rect) continue;
    
    // Get absolute coordinates of the rect
    const absoluteRect = getAbsoluteRectCoordinates(rect, group);
    
    // Check if start or end point is near this entity
    const expandedRect = {
      x: absoluteRect.x - 10,
      y: absoluteRect.y - 10,
      width: absoluteRect.width + 20,
      height: absoluteRect.height + 20
    };
    
    if (isPointInRect(startPoint, expandedRect) || isPointInRect(endPoint, expandedRect)) {
      connectedIds.push(group.id);
    }
  }
  
  return connectedIds;
}

// Convert path segments to absolute coordinates
function getAbsolutePathSegments(path) {
  const d = path.getAttribute('d') || '';
  const segments = parseSVGPath(d);
  
  // For SVG paths, the coordinates are already in the SVG coordinate system
  // No additional transformation needed for paths
  return segments;
}

// Get absolute coordinates for a rectangle, accounting for transforms
function getAbsoluteRectCoordinates(rect, parentGroup) {
  // Get basic rect attributes
  const x = parseFloat(rect.getAttribute('x') || 0);
  const y = parseFloat(rect.getAttribute('y') || 0);
  const width = parseFloat(rect.getAttribute('width') || 0);
  const height = parseFloat(rect.getAttribute('height') || 0);
  
  // Get transform from parent group
  const transform = parentGroup.getAttribute('transform') || '';
  const translateMatch = transform.match(/translate\(([^,]+),([^)]+)/);
  
  if (translateMatch) {
    const tx = parseFloat(translateMatch[1]);
    const ty = parseFloat(translateMatch[2]);
    
    return {
      x: x + tx,
      y: y + ty,
      width: width,
      height: height
    };
  }
  
  return { x, y, width, height };
}

// Check if a line segment intersects with a rectangle
function checkLineRectIntersection(x1, y1, x2, y2, rx, ry, rw, rh) {
  // First, check if either endpoint is inside the rectangle
  if (isPointInRect({ x: x1, y: y1 }, { x: rx, y: ry, width: rw, height: rh }) ||
      isPointInRect({ x: x2, y: y2 }, { x: rx, y: ry, width: rw, height: rh })) {
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }; // Return midpoint as intersection
  }
  
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
      return intersection;
    }
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