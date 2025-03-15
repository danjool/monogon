/**
 * Principia - Interactive Geometric Proof Visualization
 */

// Import core components
import { Registry } from './js/core/Registry.js';
import { ProofLoader } from './js/core/ProofLoader.js';

// Import geometry components
import { Point } from './js/geometry/Point.js';
import { Line } from './js/geometry/Line.js';
import { Circle } from './js/geometry/Circle.js';
import { Triangle } from './js/geometry/Triangle.js';
import { Plane } from './js/geometry/Plane.js';

// Import constraint components
import { ConstraintSolver } from './js/solver/ConstraintSolver.js';
import { PointOnCircle } from './js/constraints/PointOnCircle.js';
import { Parallel } from './js/constraints/Parallel.js';
import { Perpendicular } from './js/constraints/Perpendicular.js';
import { PointOnLine } from './js/constraints/PointOnLine.js';
import { FixedDistance } from './js/constraints/FixedDistance.js';
import { AngleConstraint } from './js/constraints/AngleConstraint.js';
import { Collinear } from './js/constraints/Collinear.js';

// Import rendering components
import { Renderer } from './js/rendering/Renderer.js';

// Import interaction components
import { InteractionManager } from './js/interaction/InteractionManager.js';

// Global application state
const app = {
  // Core components
  registry: null,
  proofLoader: null,
  
  // Constraint solver
  solver: null,
  
  // Rendering components
  renderer: null,
  
  // Interaction components
  interactionManager: null,
  
  // Canvas element
  canvas: null,
  
  // Application state
  initialized: false,
  
  // Options
  options: {
    showGrid: true,
    showPointLabels: true,
    showLineLabels: false,
    showCircleLabels: false,
    showTriangleLabels: true,
    showPlaneLabels: false,
    viewLineAngleAsHue: true
  }
};

/**
 * Initialize the application
 */
async function init() {
  try {
    // Get the canvas element
    const visualsContainer = document.getElementById('visuals');
    app.canvas = document.getElementById('canvas');
    
    // Set canvas size
    app.canvas.width = visualsContainer.offsetWidth;
    app.canvas.style.width = visualsContainer.offsetWidth + 'px';
    app.canvas.height = Math.min(visualsContainer.offsetHeight, window.innerHeight);
    app.canvas.style.height = Math.min(visualsContainer.offsetHeight, window.innerHeight) + 'px';
    
    // Create core components
    app.registry = new Registry();
    app.proofLoader = new ProofLoader(app.registry);
    
    // Create constraint solver with increased iterations for complex constraints
    app.solver = new ConstraintSolver(app.registry);
    app.solver.setMaxIterations(20); // Increase from default 10
    app.solver.setTolerance(0.0001); // Tighter tolerance for better precision
    
    // Create rendering components
    app.renderer = new Renderer(app.canvas, app.registry);
    
    // Create interaction components
    app.interactionManager = new InteractionManager(app.canvas, app.registry, app.solver, app.renderer);
    
    // Apply options to renderer
    for (const option in app.options) {
      app.renderer.setOption(option, app.options[option]);
    }
    
    // Set up window resize handler
    window.addEventListener('resize', handleWindowResize);
    
    // Set up control buttons
    setupControlButtons();
    
    // Load the proof
    await loadProof('corollary-ii');
    
    // Initialize the solver
    app.solver.initialize();
    
    // Solve all constraints initially to ensure proper setup
    app.solver.solveAll();
    
    // Mark as initialized
    app.initialized = true;
    
    // Log initialization
    console.log('Principia initialized');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
}

/**
 * Set up control buttons
 */
function setupControlButtons() {
  // Reset view button
  const resetViewButton = document.getElementById('reset-view');
  if (resetViewButton) {
    resetViewButton.addEventListener('click', () => {
      // Reload the proof to reset all elements
      loadProof('corollary-ii').then(() => {
        app.solver.initialize();
        app.solver.solveAll();
      });
    });
  }
  
  // Toggle grid button
  const toggleGridButton = document.getElementById('toggle-grid');
  if (toggleGridButton) {
    toggleGridButton.addEventListener('click', () => {
      app.options.showGrid = !app.options.showGrid;
      app.renderer.setOption('showGrid', app.options.showGrid);
    });
  }
  
  // Toggle labels button
  const toggleLabelsButton = document.getElementById('toggle-labels');
  if (toggleLabelsButton) {
    toggleLabelsButton.addEventListener('click', () => {
      app.options.showPointLabels = !app.options.showPointLabels;
      app.renderer.setOption('showPointLabels', app.options.showPointLabels);
    });
  }
  
  // Toggle angle hue button
  const toggleAngleHueButton = document.getElementById('toggle-angle-hue');
  if (toggleAngleHueButton) {
    toggleAngleHueButton.addEventListener('click', () => {
      app.options.viewLineAngleAsHue = !app.options.viewLineAngleAsHue;
      app.renderer.setOption('viewLineAngleAsHue', app.options.viewLineAngleAsHue);
      
      if (app.options.viewLineAngleAsHue) {
        updateLineHues();
      }
    });
  }
}

/**
 * Handle window resize
 */
function handleWindowResize() {
  const visualsContainer = document.getElementById('visuals');
  
  // Update canvas size
  app.canvas.width = visualsContainer.offsetWidth;
  app.canvas.style.width = visualsContainer.offsetWidth + 'px';
  app.canvas.height = Math.min(visualsContainer.offsetHeight, window.innerHeight);
  app.canvas.style.height = Math.min(visualsContainer.offsetHeight, window.innerHeight) + 'px';
  
  // Resize renderer
  app.renderer.getCanvas().width = app.canvas.width;
  app.renderer.getCanvas().height = app.canvas.height;
  
  // Force render
  app.renderer.render();
}

/**
 * Load a proof by ID
 * @param {string} proofId - The ID of the proof to load
 * @returns {Promise<void>}
 */
async function loadProof(proofId) {
  try {
    // Show loading indicator
    showLoadingIndicator();
    
    // Load the proof
    const proof = await app.proofLoader.load(proofId);
    
    // Update the UI
    updateProofUI(proof);
    
    // Hide loading indicator
    hideLoadingIndicator();
    
    console.log(`Proof "${proof.title}" loaded successfully`);
  } catch (error) {
    console.error(`Error loading proof "${proofId}":`, error);
    hideLoadingIndicator();
    showErrorMessage(`Failed to load proof: ${error.message}`);
  }
}

/**
 * Update the UI for the loaded proof
 * @param {Object} proof - The loaded proof
 */
function updateProofUI(proof) {
  // Update the page title
  document.title = `Principia - ${proof.title}`;
  
  // Update any UI elements that should reflect the current proof
  const proofTitleElement = document.getElementById('proof-title');
  if (proofTitleElement) {
    proofTitleElement.textContent = proof.title;
  }
  
  // Apply line hues based on angle if enabled
  if (app.options.viewLineAngleAsHue) {
    updateLineHues();
  }
}

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'flex';
  }
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

/**
 * Show error message
 * @param {string} message - The error message
 */
function showErrorMessage(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  } else {
    console.error(message);
  }
}

/**
 * Update line hues based on their angles
 */
function updateLineHues() {
  const lines = app.registry.getElementsByType('Line');
  
  for (const line of lines) {
    if (!line.start || !line.end) {
      continue;
    }
    
    const x1 = line.start.x;
    const y1 = line.start.y;
    const x2 = line.end.x;
    const y2 = line.end.y;
    
    const flipSign = (y2 - y1) < 0 ? -1 : 1;
    const theta = ((Math.atan2(flipSign * (y2 - y1), flipSign * (x2 - x1)) * 360.0 / Math.PI) + 360) % 360;
    
    line.setProperty('hue', theta);
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
