// Initialize Mermaid
mermaid.initialize({ 
  startOnLoad: false,
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true
  }
});

// Global variables for mermaid rendering
let originalMermaidCode = '';

// Function to render a mermaid diagram
function renderMermaidDiagram(containerId, mermaidCode, renderCallback) {
  mermaid.render(`render-${containerId}`, mermaidCode)
    .then(({ svg }) => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = svg;
        if (typeof renderCallback === 'function') {
          setTimeout(() => renderCallback(container.querySelector('svg')), 100);
        }
      }
    })
    .catch(error => {
      console.error(`Error rendering diagram ${containerId}:`, error);
    });
}

// Function to render the original diagram
function renderOriginalDiagram() {
  const originalMermaidDiv = document.getElementById('original-mermaid');
  const originalCodeTextarea = document.getElementById('original-code');
  
  // If this is the first render, initialize the textarea
  if (!originalCodeTextarea.value) {
    originalMermaidCode = originalMermaidDiv.textContent.trim();
    originalCodeTextarea.value = originalMermaidCode;
  } else {
    // Use the current textarea value
    originalMermaidCode = originalCodeTextarea.value.trim();
    originalMermaidDiv.textContent = originalMermaidCode;
  }
  
  renderMermaidDiagram('original-mermaid', originalMermaidCode, (svgElement) => {
    if (svgElement) {
      const edgeIntersections = findEdgeEdgeIntersections(svgElement);
      const nodeIntersections = findEdgeNodeIntersections(svgElement);
      const edgeEdgeWeight = parseFloat(document.getElementById('edge-edge-weight').value) || 10;
      const edgeNodeWeight = parseFloat(document.getElementById('edge-node-weight').value) || 1;
      const totalScore = edgeIntersections.length * edgeEdgeWeight + nodeIntersections.length * edgeNodeWeight;
      
      // Update original diagram stats
      document.getElementById('original-edge-count').textContent = edgeIntersections.length;
      document.getElementById('original-node-count').textContent = nodeIntersections.length;
      document.getElementById('original-total-score').textContent = totalScore;
      
      // Also update the current stats
      document.getElementById('edge-count').textContent = edgeIntersections.length;
      document.getElementById('node-count').textContent = nodeIntersections.length;
      document.getElementById('total-score').textContent = totalScore;
      
      // Mark intersections on the diagram
      markIntersections(svgElement, edgeIntersections, nodeIntersections);
    }
  });
}

// Function to handle changes to the original code textarea
function handleOriginalCodeChange() {
  const originalCodeTextarea = document.getElementById('original-code');
  originalCodeTextarea.addEventListener('change', () => {
    renderOriginalDiagram();
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  renderOriginalDiagram();
  handleOriginalCodeChange();
});

// Function to add a result to the container
function addResultToContainer(mermaidCode, edgeIntersections, nodeIntersections) {
  const resultId = `result-${Date.now()}`;
  const mermaidId = `mermaid-${resultId}`;
  
  // Create the result item container
  const resultItem = document.createElement('div');
  resultItem.className = 'result-item';
  
  // Add stats
  const stats = document.createElement('div');
  stats.className = 'stats';
  const edgeEdgeWeight = parseFloat(document.getElementById('edge-edge-weight').value) || 10;
  const edgeNodeWeight = parseFloat(document.getElementById('edge-node-weight').value) || 1;
  const totalScore = edgeIntersections.length * edgeEdgeWeight + nodeIntersections.length * edgeNodeWeight;
  
  stats.innerHTML = `
    <div>Edge-Edge Intersections: ${edgeIntersections.length}</div>
    <div>Edge-Node Intersections: ${nodeIntersections.length}</div>
    <div>Total Score: ${totalScore}</div>
  `;
  
  // Create content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'result-content';
  
  // Create diagram section
  const diagramSection = document.createElement('div');
  diagramSection.className = 'result-diagram';
  
  // Create the mermaid container
  const mermaidDiv = document.createElement('div');
  mermaidDiv.className = 'mermaid';
  mermaidDiv.id = mermaidId;
  mermaidDiv.textContent = mermaidCode;
  
  // Create code section
  const codeSection = document.createElement('div');
  codeSection.className = 'result-code';
  
  // Add code display
  const codeTitle = document.createElement('h4');
  codeTitle.textContent = 'Mermaid Code';
  
  const codeDisplay = document.createElement('div');
  codeDisplay.className = 'code-display';
  codeDisplay.textContent = mermaidCode;
  
  // Assemble the components
  diagramSection.appendChild(mermaidDiv);
  codeSection.appendChild(codeTitle);
  codeSection.appendChild(codeDisplay);
  
  contentWrapper.appendChild(diagramSection);
  contentWrapper.appendChild(codeSection);
  
  resultItem.appendChild(stats);
  resultItem.appendChild(contentWrapper);
  
  // Add to the results container
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.insertBefore(resultItem, resultsContainer.firstChild);
  
  // Render the diagram
  renderMermaidDiagram(mermaidId, mermaidCode, (svgElement) => {
    if (svgElement) {
      markIntersections(svgElement, edgeIntersections, nodeIntersections);
    }
  });
}

// Mark intersections on the SVG with color-coded dots
function markIntersections(svg, edgeIntersections, nodeIntersections) {
  // Create a group for all intersections
  const intersectionGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  intersectionGroup.setAttribute("class", "intersection-markers");
  
  // Add edge-edge intersections (red)
  edgeIntersections.forEach(intersection => {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    marker.setAttribute("cx", intersection.point.x);
    marker.setAttribute("cy", intersection.point.y);
    marker.setAttribute("r", "4");
    marker.setAttribute("fill", "red");
    marker.setAttribute("class", "edge-edge-marker");
    intersectionGroup.appendChild(marker);
  });
  
  // Add edge-node intersections (blue)
  nodeIntersections.forEach(intersection => {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    marker.setAttribute("cx", intersection.point.x);
    marker.setAttribute("cy", intersection.point.y);
    marker.setAttribute("r", "4");
    marker.setAttribute("fill", "blue");
    marker.setAttribute("class", "edge-node-marker");
    intersectionGroup.appendChild(marker);
  });
  
  // Add the group to the SVG
  const svgElement = svg.querySelector('g.output') || svg.querySelector('g:first-child');
  if (svgElement) {
    svgElement.appendChild(intersectionGroup);
  } else {
    svg.appendChild(intersectionGroup);
  }
}

// Export functions for use in other modules
window.MermaidRenderer = {
  renderDiagram: renderMermaidDiagram,
  addResultToContainer: addResultToContainer,
  getOriginalCode: () => originalMermaidCode,
  renderOriginalDiagram: renderOriginalDiagram
}; 