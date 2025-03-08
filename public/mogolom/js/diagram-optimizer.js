// DOM elements
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusEl = document.getElementById('status');
const iterationCountEl = document.getElementById('iteration-count');
const edgeCountEl = document.getElementById('edge-count');
const nodeCountEl = document.getElementById('node-count');
const totalScoreEl = document.getElementById('total-score');
const progressEl = document.getElementById('progress');

// Global variables for optimization
let running = false;
let iterationCount = 0;
let bestScore = Infinity;
let currentBestCode = '';
// Performance measurement variables
let totalRenderTime = 0, totalAnalysisTime = 0, renderStartTime = 0, analysisStartTime = 0;

// Event listeners
startBtn.addEventListener('click', startOptimization);
stopBtn.addEventListener('click', () => {
  running = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.textContent = 'Optimization stopped';
});

// Reset optimization state
function resetOptimization() {
  running = false;
  iterationCount = 0;
  bestScore = Infinity;
  currentBestCode = '';
  totalRenderTime = 0;
  totalAnalysisTime = 0;
  
  // Reset UI elements
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.textContent = 'Ready to optimize';
  iterationCountEl.textContent = '0';
  progressEl.style.width = '0%';
  
  // Clear results container
  document.getElementById('results-container').innerHTML = '';
}

function startOptimization() {
  if (running) return;
  
  // Get the current diagram code from the textarea
  const originalCode = document.getElementById('original-code').value.trim();
  if (!originalCode) {
    statusEl.textContent = 'No diagram code to optimize';
    return;
  }
  
  running = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  statusEl.textContent = 'Optimizing...';
  
  // Reset progress
  iterationCount = 0;
  bestScore = Infinity;
  currentBestCode = originalCode;
  progressEl.style.width = '0%';
  // Reset performance measurements
  totalRenderTime = 0;
  totalAnalysisTime = 0;
  
  // Clear previous results
  document.getElementById('results-container').innerHTML = '';
  
  // Start optimization
  optimizeDiagram();
}

function optimizeDiagram() {
  if (!running) return;
  
  const maxIterations = parseInt(document.getElementById('max-iterations').value) || 2000;
  
  iterationCount++;
  iterationCountEl.textContent = iterationCount;
  progressEl.style.width = `${(iterationCount / maxIterations) * 100}%`;
  
  // Generate a variation using the syntax swapper
  const variation = window.SyntaxSwapper.generateVariation(currentBestCode);
  
  // Create a unique ID for this variation
  const variationId = `variation-${iterationCount}`;
  
  // Create a temporary container for rendering
  const tempContainer = document.createElement('div');
  tempContainer.className = 'mermaid';
  tempContainer.id = variationId;
  tempContainer.textContent = variation;
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  document.body.appendChild(tempContainer);
  
  // Start measuring render time
  renderStartTime = performance.now();
  
  // Render with Mermaid
  window.MermaidRenderer.renderDiagram(variationId, variation, (svgElement) => {
    // Calculate render time
    totalRenderTime += performance.now() - renderStartTime;
    
    if (svgElement) {
      // Start measuring analysis time
      analysisStartTime = performance.now();
      
      // Use SVGAnalyzer to calculate the score
      const { edgeIntersections, nodeIntersections, totalScore } = window.SVGAnalyzer.calculateDiagramScore(svgElement);
      
      // Calculate analysis time
      totalAnalysisTime += performance.now() - analysisStartTime;
      
      // Check if this is better than our current best
      if (totalScore < bestScore) {
        bestScore = totalScore;
        currentBestCode = variation;
        
        // Add this result to the container
        window.MermaidRenderer.addResultToContainer(variation, edgeIntersections, nodeIntersections);
        
        // Update status
        statusEl.textContent = `Found better layout with score ${totalScore}`;
      }
      
      // Log performance every 32 iterations
      if (iterationCount % 32 === 0) {
        console.log(`Iteration ${iterationCount}: Avg Render: ${(totalRenderTime/iterationCount).toFixed(2)}ms, Avg Analysis: ${(totalAnalysisTime/iterationCount).toFixed(2)}ms, Ratio: ${(totalRenderTime/totalAnalysisTime).toFixed(2)}`);
      }
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Continue or stop
      if (iterationCount < maxIterations && running) {
        setTimeout(optimizeDiagram, 10);
      } else {
        running = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        statusEl.textContent = 'Optimization complete';
        progressEl.style.width = '100%';
        // Log final performance stats
        console.log(`Final stats - Total iterations: ${iterationCount}, Avg Render: ${(totalRenderTime/iterationCount).toFixed(2)}ms, Avg Analysis: ${(totalAnalysisTime/iterationCount).toFixed(2)}ms, Ratio: ${(totalRenderTime/totalAnalysisTime).toFixed(2)}`);
      }
    }
  });
}

// Export functions for use in other modules
window.DiagramOptimizer = {
  start: startOptimization,
  stop: () => {
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusEl.textContent = 'Optimization stopped';
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Listen for example changes to reset optimization state
  document.getElementById('example-selector').addEventListener('change', resetOptimization);
}); 