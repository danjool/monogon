// Initialize Mermaid
mermaid.initialize({ 
  startOnLoad: false,
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true
  }
});

// DOM Elements
const codeEditor = document.getElementById('code-editor');
const diagram = document.getElementById('diagram');
const optimizeBtn = document.getElementById('optimize-btn');
const deOptimizeBtn = document.getElementById('de-optimize-btn');
const scoreDisplay = document.getElementById('score');
const edgeEdgeCount = document.getElementById('edge-edge-count');
const edgeNodeCount = document.getElementById('edge-node-count');
const improvementsCount = document.getElementById('improvements-count');
const iterationsCount = document.getElementById('iterations-count');

// State
let isOptimizing = false;
let isDeOptimizing = false;
let currentIteration = 0;
let iterationsSinceImprovement = 0;
let maxIterations = 2000;
let bestScore = Infinity;
let currentCode = '';
let improvementsFound = 0;
let isEditorEnabled = true;

// Setup resizable panes
const resizer = document.getElementById('resizer');
const leftPane = document.querySelector('.left-pane');
const rightPane = document.querySelector('.right-pane');

let x = 0;
let leftWidth = 40; // Default to 40% for left pane (40/60 split)

// Set initial pane sizes
function setInitialPaneSizes() {
  leftPane.style.flex = `0 0 ${leftWidth}%`;
  rightPane.style.flex = `0 0 ${100 - leftWidth}%`;
}

const initResize = (e) => {
  x = e.clientX;
  leftWidth = leftPane.getBoundingClientRect().width;
  document.documentElement.style.cursor = 'col-resize';
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  resizer.classList.add('resizing');
};

const onResize = (e) => {
  const dx = e.clientX - x;
  const newLeftWidth = (leftWidth + dx) / resizer.parentNode.getBoundingClientRect().width * 100;
  leftPane.style.flex = `0 0 ${newLeftWidth}%`;
  rightPane.style.flex = `0 0 ${100 - newLeftWidth}%`;
};

const stopResize = () => {
  document.documentElement.style.cursor = '';
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
  resizer.classList.remove('resizing');
};

// Functions
function loadExample(example) {
  currentCode = example.code;
  codeEditor.value = example.code;
  renderDiagram();
}

// Make renderDiagram globally accessible
function renderDiagram() {
  diagram.textContent = codeEditor.value;
  mermaid.render('rendered-diagram', codeEditor.value)
    .then(({ svg }) => {
      diagram.innerHTML = svg;
      
      // Ensure SVG is properly sized
      const svgElement = diagram.querySelector('svg');
      if (svgElement) {
        // Get the original dimensions
        const originalWidth = svgElement.getAttribute('width') || svgElement.getBBox().width;
        const originalHeight = svgElement.getAttribute('height') || svgElement.getBBox().height;
        
        // Set viewBox to maintain aspect ratio
        svgElement.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
        
        // Remove fixed dimensions that might be constraining the SVG
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        
        // Add responsive styling
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
        svgElement.style.maxHeight = '100%';
        svgElement.style.display = 'block';
        
        // Add preserveAspectRatio to ensure the diagram fits within the container
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        // Add a class to help with styling
        svgElement.classList.add('mermaid-svg');
      }
      
      analyzeDiagram();
    })
    .catch(error => {
      console.error('Error rendering diagram:', error);
      diagram.innerHTML = '<div style="color: red; padding: 1rem;">Error rendering diagram</div>';
    });
}

// Expose renderDiagram globally
window.renderDiagram = renderDiagram;

function analyzeDiagram() {
  const svg = diagram.querySelector('svg');
  if (!svg) return;
  
  // Use the new comprehensive scoring system
  const result = window.SVGAnalyzer.calculateDiagramScore(svg);
  
  // Update UI with metrics
  updateMetricsUI(result);
  
  // Store metrics for use in optimization
  window.currentDiagramMetrics = result.metrics;
  
  // Mark intersections on the SVG
  markIntersections(svg, result.edgeIntersections, result.nodeIntersections);
  
  bestScore = result.totalScore;
}

function markIntersections(svg, edgeIntersections, nodeIntersections) {
  // Remove previous markers
  const existingMarkers = svg.querySelectorAll('.intersection-markers');
  existingMarkers.forEach(marker => marker.remove());
  
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
    marker.setAttribute("vector-effect", "non-scaling-stroke");
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
    marker.setAttribute("vector-effect", "non-scaling-stroke");
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

function startDeOptimization() {
  isDeOptimizing = !isDeOptimizing;
  startOptimization();
}

function startOptimization() {
  currentCode = codeEditor.value.trim();
  if (!currentCode) {
    return;
  }
  
  // Remove pulse animation on first click
  optimizeBtn.classList.remove('pulse-until-click');
  
  isOptimizing = true;
  currentIteration = 0;
  maxIterations = 2000;
  bestScore = isDeOptimizing ? 0 : Infinity;
  improvementsFound = 0;
  
  optimizeBtn.disabled = true;
  codeEditor.disabled = true;
  isEditorEnabled = false;
  
  // Enable stop button
  const stopBtn = document.getElementById('stop-btn');
  stopBtn.disabled = false;
  
  // Reset counters
  iterationsCount.textContent = '0';
  improvementsCount.textContent = '0';
  
  // Analyze current diagram
  renderDiagram();
  
  // Start optimization
  setTimeout(optimizeDiagram, 100);
}

function optimizeDiagram() {
  if (!isOptimizing) return;
  
  if (currentIteration >= maxIterations) {
    completeOptimization();
    return;
  }
  
  currentIteration++;
  iterationsSinceImprovement++;
  iterationsCount.textContent = currentIteration;
  
  // Get problematic edges from previous iteration if available
  let problematicEdges = [];
  let longestPaths = [];
  let metrics = null;
  
  if (currentIteration > 1) {
    const svgElement = diagram.querySelector('svg');
    if (svgElement) {
      // Use the new comprehensive scoring system
      const result = window.SVGAnalyzer.calculateDiagramScore(svgElement);
      
      // Extract edge identifiers from intersections
      problematicEdges = [
        ...result.edgeIntersections.flatMap(int => {
          const paths = int.paths || [];
          return paths.map(p => p.id || '').filter(id => id);
        }),
        ...result.nodeIntersections.map(int => int.path?.id || '').filter(id => id)
      ];
      
      // Get complete metrics
      metrics = result.metrics;
      
      // Extract longest paths
      if (metrics && metrics.pathLengths && metrics.pathLengths.longest) {
        longestPaths = metrics.pathLengths.longest.map(p => p.id).filter(id => id);
      }
    }
  }
  
  // Generate a variation with enhanced metrics
  const variation = window.SyntaxSwapper.generateVariation(
    currentCode, 
    problematicEdges, 
    iterationsSinceImprovement, 
    bestScore,
    metrics, // Pass full metrics
    longestPaths // Pass longest paths
  );
  
  // Create a temporary container for rendering
  const tempContainer = document.createElement('div');
  tempContainer.className = 'mermaid';
  tempContainer.id = `temp-diagram-${currentIteration}`;
  tempContainer.style.display = 'none';
  document.body.appendChild(tempContainer);
  
  // Render with Mermaid
  mermaid.render(`render-temp-${currentIteration}`, variation)
    .then(({ svg }) => {
      tempContainer.innerHTML = svg;
      const svgElement = tempContainer.querySelector('svg');
      
      if (svgElement) {
        // Use the new comprehensive scoring system
        const result = window.SVGAnalyzer.calculateDiagramScore(svgElement);
        const totalScore = result.totalScore;
        
        // Check if better than current best
        if(isDeOptimizing ? totalScore > bestScore : totalScore < bestScore) {
          bestScore = totalScore;
          currentCode = variation;
          improvementsFound++;
          iterationsSinceImprovement = 0;
          // Update editor and render new diagram
          codeEditor.value = variation;
          diagram.textContent = variation;
          diagram.innerHTML = svg;
          
          // Update stats
          updateMetricsUI(result);
          improvementsCount.textContent = improvementsFound;
          
          // Ensure SVG is properly sized
          const displayedSvg = diagram.querySelector('svg');
          if (displayedSvg) {
            // Get the original dimensions
            const originalWidth = displayedSvg.getAttribute('width') || displayedSvg.getBBox().width;
            const originalHeight = displayedSvg.getAttribute('height') || displayedSvg.getBBox().height;
            
            // Set viewBox to maintain aspect ratio
            displayedSvg.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
            
            // Remove fixed dimensions that might be constraining the SVG
            displayedSvg.removeAttribute('width');
            displayedSvg.removeAttribute('height');
            
            // Add responsive styling
            displayedSvg.style.width = '100%';
            displayedSvg.style.height = '100%';
            displayedSvg.style.maxHeight = '100%';
            displayedSvg.style.display = 'block';
            
            // Add preserveAspectRatio to ensure the diagram fits within the container
            displayedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            
            // Add a class to help with styling
            displayedSvg.classList.add('mermaid-svg');
          }
          
          // Mark intersections
          markIntersections(displayedSvg, result.edgeIntersections, result.nodeIntersections);
          
          // Auto-stop if score reaches zero
          if (totalScore === 0) {
            completeOptimization();
            return;
          }
        }
      }
      
      // Clean up
      tempContainer.remove();
      
      // Continue optimization
      setTimeout(optimizeDiagram, 0);
    })
    .catch(error => {
      console.error('Error rendering variation:', error);
      tempContainer.remove();
      setTimeout(optimizeDiagram, 0);
    });
}

function completeOptimization() {
  isOptimizing = false;
  optimizeBtn.disabled = false;
  codeEditor.disabled = false;
  isEditorEnabled = true;
  
  // Disable stop button
  const stopBtn = document.getElementById('stop-btn');
  stopBtn.disabled = true;
  
  // Add success styling to stat cards
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach(card => {
    card.classList.add('success');
    
    // Remove success class after 5 seconds
    setTimeout(() => {
      card.classList.remove('success');
    }, 5000);
  });
}

function stopOptimization() {
  if (!isOptimizing) return;
  
  isOptimizing = false;
  optimizeBtn.disabled = false;
  codeEditor.disabled = false;
  isEditorEnabled = true;
  
  // Disable stop button
  const stopBtn = document.getElementById('stop-btn');
  stopBtn.disabled = true;
}

// Update the UI with the latest metrics and scores
function updateMetricsUI(result) {
  const metrics = result.metrics;
  if (!metrics) return;
  
  // Helper function to safely update an element if it exists
  const safelyUpdateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  
  // Update score displays
  safelyUpdateElement('total-score', metrics.totalScore.toFixed(2));
  safelyUpdateElement('edge-edge-score', metrics.scores.edgeEdge.toFixed(2));
  safelyUpdateElement('edge-node-score', metrics.scores.edgeNode.toFixed(2));
  safelyUpdateElement('area-score', metrics.scores.diagramArea.toFixed(2));
  safelyUpdateElement('edge-length-score', 
    (metrics.scores.edgeLength + metrics.scores.maxEdgeLength).toFixed(2));
  safelyUpdateElement('curve-score', metrics.scores.curveCount.toFixed(2));
  safelyUpdateElement('rect-area-score', metrics.scores.rectArea.toFixed(2));
  
  // Update intersection counts
  safelyUpdateElement('edge-edge-count', metrics.intersections.edgeEdge.count);
  safelyUpdateElement('edge-node-count', metrics.intersections.edgeNode.count);
  
  // Update diagram size metrics
  safelyUpdateElement('diagram-area', metrics.dimensions.area.toFixed(0));
  safelyUpdateElement('node-count', metrics.nodes);
  safelyUpdateElement('edge-count', metrics.edges.total);
  
  // Update edge metrics
  safelyUpdateElement('total-edge-length', metrics.pathLengths.total.toFixed(0));
  safelyUpdateElement('longest-edge', 
    (metrics.pathLengths.longest[0]?.length || 0).toFixed(0));
  safelyUpdateElement('avg-edge-length', metrics.pathLengths.average.toFixed(0));
  
  // Update node geometry metrics
  safelyUpdateElement('curve-count', metrics.edges.curves);
  safelyUpdateElement('total-rect-area', metrics.rectArea.toFixed(0));
  safelyUpdateElement('avg-rect-area', 
    (metrics.nodes > 0 ? metrics.rectArea / metrics.nodes : 0).toFixed(0));
  
  // Legacy score update for backward compatibility
  safelyUpdateElement('score', metrics.totalScore.toFixed(2));
}

// Initialize the application
function init() {
  // Set initial pane sizes
  setInitialPaneSizes();
  
  // Setup resizer
  resizer.addEventListener('mousedown', initResize);
  
  // Setup code editor
  codeEditor.addEventListener('input', () => {
    if (isEditorEnabled) {
      renderDiagram();
    }
  });
  
  // Setup optimize button
  optimizeBtn.addEventListener('click', startOptimization);
  deOptimizeBtn.addEventListener('click', startDeOptimization);
  
  // Setup stop button
  const stopBtn = document.getElementById('stop-btn');
  stopBtn.addEventListener('click', stopOptimization);
  stopBtn.disabled = true; // Initially disabled
  
  // Load default example if available
  const examples = window.ExampleManager.getExamples();
  if (examples && examples.length > 0) {
    loadExample(examples[0]);
  }
  
  // Setup weight controls
  setupWeightControls();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Initialize right away since DOM might already be loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
}

// Add event listeners for the weight inputs to update scores in real-time
function setupWeightControls() {
  const weightInputs = [
    'edge-edge-weight',
    'edge-node-weight',
    'area-weight',
    'edge-length-weight',
    'max-edge-weight',
    'curve-weight',
    'rect-area-weight'
  ];
  
  weightInputs.forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      // Re-analyze the current diagram with new weights
      const svg = document.querySelector('#diagram svg');
      const result = SVGAnalyzer.calculateDiagramScore(svg);
      updateMetricsUI(result);
    });
  });
} 