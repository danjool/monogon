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
const scoreDisplay = document.getElementById('score');
const edgeEdgeCount = document.getElementById('edge-edge-count');
const edgeNodeCount = document.getElementById('edge-node-count');
const improvementsCount = document.getElementById('improvements-count');
const iterationsCount = document.getElementById('iterations-count');

// State
let isOptimizing = false;
let currentIteration = 0;
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
        // Remove fixed dimensions that might be constraining the SVG
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        
        // Set viewBox if it doesn't exist to maintain aspect ratio
        if (!svgElement.getAttribute('viewBox') && 
            svgElement.getAttribute('width') && 
            svgElement.getAttribute('height')) {
          const width = parseFloat(svgElement.getAttribute('width'));
          const height = parseFloat(svgElement.getAttribute('height'));
          svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
        
        // Add responsive styling
        svgElement.style.width = '100%';
        svgElement.style.minWidth = '300px';
        svgElement.style.height = 'auto';
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
  
  const edgeIntersections = window.SVGAnalyzer.findEdgeEdgeIntersections(svg);
  const nodeIntersections = window.SVGAnalyzer.findEdgeNodeIntersections(svg);
  const edgeEdgeWeight = 10;
  const edgeNodeWeight = 1;
  const totalScore = edgeIntersections.length * edgeEdgeWeight + nodeIntersections.length * edgeNodeWeight;
  
  scoreDisplay.textContent = totalScore;
  edgeEdgeCount.textContent = edgeIntersections.length;
  edgeNodeCount.textContent = nodeIntersections.length;
  
  // Mark intersections on the SVG
  markIntersections(svg, edgeIntersections, nodeIntersections);
  
  bestScore = totalScore;
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
  bestScore = Infinity;
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
  iterationsCount.textContent = currentIteration;
  
  // Get problematic edges from previous iteration if available
  let problematicEdges = [];
  if (currentIteration > 1) {
    const svgElement = diagram.querySelector('svg');
    if (svgElement) {
      const edgeIntersections = window.SVGAnalyzer.findEdgeEdgeIntersections(svgElement);
      const nodeIntersections = window.SVGAnalyzer.findEdgeNodeIntersections(svgElement);
      
      // Extract edge identifiers from intersections
      problematicEdges = [
        ...edgeIntersections.flatMap(int => {
          const paths = int.paths || [];
          return paths.map(p => p.id || '').filter(id => id);
        }),
        ...nodeIntersections.map(int => int.path?.id || '').filter(id => id)
      ];
    }
  }
  
  // Generate a variation with problematic edges info
  const variation = window.SyntaxSwapper.generateVariation(currentCode, problematicEdges);
  
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
        // Calculate score
        const edgeIntersections = window.SVGAnalyzer.findEdgeEdgeIntersections(svgElement);
        const nodeIntersections = window.SVGAnalyzer.findEdgeNodeIntersections(svgElement);
        const edgeEdgeWeight = 10;
        const edgeNodeWeight = 1;
        const totalScore = edgeIntersections.length * edgeEdgeWeight + nodeIntersections.length * edgeNodeWeight;
        
        // Check if better than current best
        if (totalScore < bestScore) {
          bestScore = totalScore;
          currentCode = variation;
          improvementsFound++;
          
          // Update editor and render new diagram
          codeEditor.value = variation;
          diagram.textContent = variation;
          diagram.innerHTML = svg;
          
          // Update stats
          scoreDisplay.textContent = totalScore;
          edgeEdgeCount.textContent = edgeIntersections.length;
          edgeNodeCount.textContent = nodeIntersections.length;
          improvementsCount.textContent = improvementsFound;
          
          // Ensure SVG is properly sized
          const displayedSvg = diagram.querySelector('svg');
          if (displayedSvg) {
            displayedSvg.removeAttribute('width');
            displayedSvg.removeAttribute('height');
            displayedSvg.style.width = '100%';
            displayedSvg.style.minWidth = '300px';
            displayedSvg.style.height = 'auto';
          }
          
          // Mark intersections
          markIntersections(svgElement, edgeIntersections, nodeIntersections);
          
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
  
  // Setup stop button
  const stopBtn = document.getElementById('stop-btn');
  stopBtn.addEventListener('click', stopOptimization);
  stopBtn.disabled = true; // Initially disabled
  
  // Load default example if available
  const examples = window.ExampleManager.getExamples();
  if (examples && examples.length > 0) {
    loadExample(examples[0]);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Initialize right away since DOM might already be loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} 