// Simple Pan and Zoom functionality for ER Diagram
(function() {
  // Global variables to track state across re-initializations
  let globalIsDragging = false;
  let globalLastX = 0;
  let globalLastY = 0;
  let globalTranslateX = 0;
  let globalTranslateY = 0;
  let globalScale = 1;
  let currentSvgElement = null;
  let eventListenersAttached = false;
  
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanZoom);
  } else {
    // DOM already loaded, initialize immediately
    initPanZoom();
  }

  function initPanZoom() {
    // Try to find the SVG immediately
    let svgElement = document.querySelector('.mermaid svg');
    
    if (svgElement) {
      setupPanZoom(svgElement);
    }
    
    // Set up a MutationObserver to watch for SVG changes
    setupMutationObserver();
    
    // Also hook into the renderDiagram function if it exists
    hookIntoRenderDiagram();
    
    // Hook into the optimization process
    hookIntoOptimization();
  }
  
  function setupMutationObserver() {
    const observer = new MutationObserver(function(mutations) {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if an SVG was added
          const svgElement = document.querySelector('.mermaid svg');
          if (svgElement && svgElement !== currentSvgElement) {
            setupPanZoom(svgElement);
          }
        }
      }
    });
    
    // Start observing the diagram container
    const diagramElement = document.getElementById('diagram');
    if (diagramElement) {
      observer.observe(diagramElement, {
        childList: true,
        subtree: true
      });
    }
  }
  
  function hookIntoRenderDiagram() {
    if (window.renderDiagram) {
      const originalRenderDiagram = window.renderDiagram;
      window.renderDiagram = function() {
        const result = originalRenderDiagram.apply(this, arguments);
        
        // Wait a bit for the SVG to be rendered
        setTimeout(function() {
          const newSvg = document.querySelector('.mermaid svg');
          if (newSvg && newSvg !== currentSvgElement) {
            setupPanZoom(newSvg);
          }
        }, 200);
        
        return result;
      };
    }
  }
  
  function hookIntoOptimization() {
    // Hook into optimization functions if they exist
    if (window.startOptimization) {
      const originalStartOptimization = window.startOptimization;
      window.startOptimization = function() {
        const result = originalStartOptimization.apply(this, arguments);
        // Reset pan/zoom state when optimization starts
        globalScale = 1;
        globalTranslateX = 0;
        globalTranslateY = 0;
        return result;
      };
    }
    
    if (window.completeOptimization) {
      const originalCompleteOptimization = window.completeOptimization;
      window.completeOptimization = function() {
        const result = originalCompleteOptimization.apply(this, arguments);
        // Re-apply pan/zoom after optimization completes
        setTimeout(function() {
          const newSvg = document.querySelector('.mermaid svg');
          if (newSvg) {
            setupPanZoom(newSvg);
          }
        }, 300);
        return result;
      };
    }
    
    // Also hook into the optimization step function
    if (window.optimizeDiagram) {
      const originalOptimizeDiagram = window.optimizeDiagram;
      window.optimizeDiagram = function() {
        const result = originalOptimizeDiagram.apply(this, arguments);
        // Check for SVG updates during optimization
        const newSvg = document.querySelector('.mermaid svg');
        if (newSvg && newSvg !== currentSvgElement) {
          setupPanZoom(newSvg);
        }
        return result;
      };
    }
  }
  
  function setupPanZoom(svgElement) {
    // Store the current SVG element
    currentSvgElement = svgElement;
    console.log('Setting up pan-zoom for SVG:', svgElement);
    
    const container = document.querySelector('.mermaid-container');
    if (!container) {
      console.error('Could not find mermaid container');
      return;
    }
    
    // Make sure the SVG can be transformed
    svgElement.style.transformOrigin = '0 0';
    
    // Set cursor style
    container.style.cursor = 'grab';
    
    // Apply current transform to the new SVG
    applyTransform();
    
    // Only attach event listeners once
    if (!eventListenersAttached) {
      attachEventListeners(container);
      eventListenersAttached = true;
    }
    
    // Calculate and apply initial fit if this is the first time
    if (globalScale === 1 && globalTranslateX === 0 && globalTranslateY === 0) {
      // Wait a bit for the SVG to be fully rendered with all its dimensions
      setTimeout(resetView, 300);
    }
  }
  
  // Apply transform to the current SVG element
  function applyTransform() {
    if (currentSvgElement) {
      currentSvgElement.style.transform = `translate(${globalTranslateX}px, ${globalTranslateY}px) scale(${globalScale})`;
    }
  }
  
  // Calculate the scale needed to fit the diagram in the container
  function calculateFitScale() {
    try {
      if (!currentSvgElement) return 0.8;
      
      // Ensure SVG has proper dimensions
      if (currentSvgElement.getAttribute('width') === '100%' || !currentSvgElement.getAttribute('width')) {
        // Try to get dimensions from viewBox if width/height are not set
        const viewBox = currentSvgElement.getAttribute('viewBox');
        if (viewBox) {
          const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
          if (vbWidth && vbHeight) {
            currentSvgElement.setAttribute('width', vbWidth);
            currentSvgElement.setAttribute('height', vbHeight);
          }
        }
      }
      
      // Get the natural size of the SVG
      const svgBBox = currentSvgElement.getBBox();
      
      // Add a small margin to ensure we capture all elements
      const svgWidth = svgBBox.width + 20;
      const svgHeight = svgBBox.height + 20;
      
      // Get the container size (accounting for the stats section at the bottom)
      const container = document.querySelector('.mermaid-container');
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // Add padding (15% of container size)
      const paddingX = containerWidth * 0.15;
      const paddingY = containerHeight * 0.15;
      
      // Calculate scale to fit width and height
      const scaleX = (containerWidth - paddingX) / svgWidth;
      const scaleY = (containerHeight - paddingY) / svgHeight;
      
      // Use the smaller scale to ensure the entire diagram fits
      const fitScale = Math.min(scaleX, scaleY);
      
      // Limit scale to reasonable bounds
      return Math.max(0.2, Math.min(1.5, fitScale));
    } catch (e) {
      console.error('Error calculating fit scale:', e);
      return 0.8; // Default to scale 0.8 if there's an error (slightly zoomed out)
    }
  }
  
  // Reset view to fit the diagram in the container
  function resetView() {
    try {
      if (!currentSvgElement) return;
      
      // Calculate the scale to fit
      globalScale = calculateFitScale();
      
      // Get the SVG dimensions
      const svgBBox = currentSvgElement.getBBox();
      const container = document.querySelector('.mermaid-container');
      const containerRect = container.getBoundingClientRect();
      
      // Calculate the center position of the SVG content
      const svgCenterX = svgBBox.x + svgBBox.width / 2;
      const svgCenterY = svgBBox.y + svgBBox.height / 2;
      
      // Calculate the translation needed to center the SVG
      globalTranslateX = (containerRect.width / 2) - (svgCenterX * globalScale);
      globalTranslateY = (containerRect.height / 2) - (svgCenterY * globalScale);
      
      // Apply the transform
      applyTransform();
      
      console.log('Reset view with scale:', globalScale, 'translate:', globalTranslateX, globalTranslateY);
    } catch (e) {
      console.error('Error resetting view:', e);
      // Fallback to simple reset with a slightly zoomed out view
      globalScale = 0.8;
      globalTranslateX = 0;
      globalTranslateY = 0;
      applyTransform();
    }
  }
  
  // Attach all event listeners to the container
  function attachEventListeners(container) {
    // Mouse wheel zoom
    container.addEventListener('wheel', function(e) {
      e.preventDefault();
      
      // Determine zoom direction
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const newScale = Math.max(0.1, Math.min(5, globalScale + delta));
      
      // Get mouse position relative to container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate new position to zoom at mouse point
      if (newScale !== globalScale) {
        // Calculate mouse position relative to current transform
        const mouseRelativeX = (mouseX - globalTranslateX) / globalScale;
        const mouseRelativeY = (mouseY - globalTranslateY) / globalScale;
        
        // Calculate new position
        globalTranslateX = mouseX - mouseRelativeX * newScale;
        globalTranslateY = mouseY - mouseRelativeY * newScale;
        
        globalScale = newScale;
        applyTransform();
      }
    }, { passive: false });
    
    // Mouse drag panning
    container.addEventListener('mousedown', function(e) {
      if (e.button === 0) { // Left mouse button
        globalIsDragging = true;
        globalLastX = e.clientX;
        globalLastY = e.clientY;
        container.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });
    
    document.addEventListener('mousemove', function(e) {
      if (globalIsDragging) {
        const dx = e.clientX - globalLastX;
        const dy = e.clientY - globalLastY;
        
        globalTranslateX += dx;
        globalTranslateY += dy;
        
        globalLastX = e.clientX;
        globalLastY = e.clientY;
        
        applyTransform();
        e.preventDefault();
      }
    });
    
    document.addEventListener('mouseup', function() {
      if (globalIsDragging) {
        globalIsDragging = false;
        container.style.cursor = 'grab';
      }
    });
    
    // Double-click to reset
    container.addEventListener('dblclick', function(e) {
      resetView();
    });
    
    // Touch events for mobile
    container.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        globalIsDragging = true;
        globalLastX = e.touches[0].clientX;
        globalLastY = e.touches[0].clientY;
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
      if (globalIsDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - globalLastX;
        const dy = e.touches[0].clientY - globalLastY;
        
        globalTranslateX += dx;
        globalTranslateY += dy;
        
        globalLastX = e.touches[0].clientX;
        globalLastY = e.touches[0].clientY;
        
        applyTransform();
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('touchend', function() {
      globalIsDragging = false;
    });
  }
})(); 