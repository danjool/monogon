// MOGOLOM - Main JavaScript for the Mermaid Optimizer UI
document.addEventListener('DOMContentLoaded', () => {
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
  const statusText = document.getElementById('status-text');
  const progressBar = document.getElementById('progress-bar');
  const iterationCount = document.getElementById('iteration-count');
  const scoreDisplay = document.getElementById('score');
  const edgeEdgeCount = document.getElementById('edge-edge-count');
  const edgeNodeCount = document.getElementById('edge-node-count');
  const improvementsCount = document.getElementById('improvements-count');
  
  // State
  let isOptimizing = false;
  let currentIteration = 0;
  let iterationsSinceImprovement = 0;
  let maxIterations = 2000;
  let bestScore = Infinity;
  let currentCode = '';
  let improvementsFound = 0;
  
  // Setup resizable panes
  const resizer = document.getElementById('resizer');
  const leftPane = document.querySelector('.left-pane');
  const rightPane = document.querySelector('.right-pane');
  
  let x = 0;
  let leftWidth = 50;
  
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
  
  resizer.addEventListener('mousedown', initResize);
  
  // Setup accordion
  const accordionHeader = document.querySelector('.accordion-header');
  const accordionContent = document.querySelector('.accordion-content');
  
  accordionHeader.addEventListener('click', () => {
    accordionContent.classList.toggle('open');
    accordionHeader.querySelector('i').classList.toggle('fa-chevron-down');
    accordionHeader.querySelector('i').classList.toggle('fa-chevron-up');
  });
  
  // Populate examples using ExampleManager
  const examplesList = document.getElementById('examples-list');
  
  function populateExamples() {
    examplesList.innerHTML = '';
    const examples = window.ExampleManager.getExamples();
    
    examples.forEach(example => {
      const button = document.createElement('button');
      button.className = 'example-btn';
      button.textContent = example.name;
      button.addEventListener('click', () => {
        loadExample(example.id);
      });
      examplesList.appendChild(button);
    });
  }
  
  // Functions
  function loadExample(exampleId) {
    window.ExampleManager.loadExample(exampleId);
    currentCode = document.getElementById('original-code').value;
    codeEditor.value = currentCode;
    renderDiagram();
  }
  
  function renderDiagram() {
    diagram.textContent = codeEditor.value;
    mermaid.render('rendered-diagram', codeEditor.value)
      .then(({ svg }) => {
        diagram.innerHTML = svg;
        analyzeDiagram();
      })
      .catch(error => {
        console.error('Error rendering diagram:', error);
        diagram.innerHTML = '<div style="color: red; padding: 1rem;">Error rendering diagram</div>';
      });
  }
  
  function analyzeDiagram() {
    const svg = diagram.querySelector('svg');
    if (!svg) return;
    
    const { edgeIntersections, nodeIntersections, totalScore } = window.SVGAnalyzer.calculateDiagramScore(svg);
    
    scoreDisplay.textContent = totalScore;
    edgeEdgeCount.textContent = edgeIntersections.length;
    edgeNodeCount.textContent = nodeIntersections.length;
    
    // Mark intersections on the SVG
    window.MermaidRenderer.markIntersections(svg, edgeIntersections, nodeIntersections);
    
    bestScore = totalScore;
  }
  
  function startOptimization() {
    if (isOptimizing) return;
    
    currentCode = codeEditor.value.trim();
    if (!currentCode) {
      statusText.textContent = 'No diagram code to optimize';
      return;
    }
    
    isOptimizing = true;
    currentIteration = 0;
    maxIterations = 2000;
    bestScore = Infinity;
    improvementsFound = 0;
    
    optimizeBtn.disabled = true;
    codeEditor.disabled = true;
    statusText.textContent = 'Optimizing...';
    
    // Analyze current diagram
    renderDiagram();
    
    // Start optimization
    setTimeout(optimizeDiagram, 100);
  }
  
  function optimizeDiagram() {
    if (!isOptimizing) return;
    
    currentIteration++;
    iterationCount.textContent = `${currentIteration}/${maxIterations}`;
    progressBar.style.width = `${(currentIteration / maxIterations) * 100}%`;
    
    // Generate a variation
    const variation = window.SyntaxSwapper.generateVariation(
      currentCode, problematicEdges, iterationsSinceImprovement, bestScore
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
          // Calculate score
          const { edgeIntersections, nodeIntersections, totalScore } = window.SVGAnalyzer.calculateDiagramScore(svgElement);
          
          // Check if better than current best
          if (totalScore < bestScore) {
            bestScore = totalScore;
            currentCode = variation;
            improvementsFound++;
            iterationsSinceImprovement = 0;
            
            // Update editor and render new diagram
            codeEditor.value = variation;
            diagram.textContent = variation;
            diagram.innerHTML = svg;
            
            // Update stats
            scoreDisplay.textContent = totalScore;
            edgeEdgeCount.textContent = edgeIntersections.length;
            edgeNodeCount.textContent = nodeIntersections.length;
            improvementsCount.textContent = improvementsFound;
            
            // Mark intersections
            window.MermaidRenderer.markIntersections(svgElement, edgeIntersections, nodeIntersections);
            
            statusText.textContent = `Found better layout with score ${totalScore}`;
          }
        }
        
        // Clean up
        document.body.removeChild(tempContainer);
        
        // Continue or stop
        if (currentIteration < maxIterations && isOptimizing) {
          setTimeout(optimizeDiagram, 0);
        } else {
          completeOptimization();
        }
      })
      .catch(error => {
        console.error('Error rendering variation:', error);
        document.body.removeChild(tempContainer);
        
        // Continue despite error
        if (currentIteration < maxIterations && isOptimizing) {
          setTimeout(optimizeDiagram, 0);
        } else {
          completeOptimization();
        }
      });
  }
  
  function completeOptimization() {
    isOptimizing = false;
    optimizeBtn.disabled = false;
    codeEditor.disabled = false;
    statusText.textContent = 'Optimization complete';
    progressBar.style.width = '100%';
    
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
    statusText.textContent = 'Optimization stopped';
  }
  
  // Event listeners
  optimizeBtn.addEventListener('click', startOptimization);
  
  codeEditor.addEventListener('input', () => {
    if (!isOptimizing) {
      // Debounce rendering to avoid too frequent updates
      clearTimeout(codeEditor.debounceTimer);
      codeEditor.debounceTimer = setTimeout(() => {
        renderDiagram();
      }, 1000);
    }
  });
  
  // Initialize
  populateExamples();
  
  // Load the first example by default
  const examples = window.ExampleManager.getExamples();
  if (examples.length > 0) {
    loadExample(examples[0].id);
  }
}); 