// Simple Pan and Zoom functionality for ER Diagram
(function() {
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
    
    // If not found, set up a MutationObserver to watch for it
    const observer = new MutationObserver(function(mutations) {
      svgElement = document.querySelector('.mermaid svg');
      if (svgElement) {
        setupPanZoom(svgElement);
        observer.disconnect();
      }
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also hook into the renderDiagram function if it exists
    if (window.renderDiagram) {
      const originalRenderDiagram = window.renderDiagram;
      window.renderDiagram = function() {
        const result = originalRenderDiagram.apply(this, arguments);
        
        // Wait a bit for the SVG to be rendered
        setTimeout(function() {
          const newSvg = document.querySelector('.mermaid svg');
          if (newSvg) {
            setupPanZoom(newSvg);
          }
        }, 200);
        
        return result;
      };
    }
  }
  
  // Track if we've already set up pan-zoom
  let isPanZoomSetup = false;
  
  function setupPanZoom(svgElement) {
    // Avoid setting up multiple times
    if (isPanZoomSetup) {
      return;
    }
    
    isPanZoomSetup = true;
    console.log('Setting up pan-zoom for SVG:', svgElement);
    
    const container = document.querySelector('.mermaid-container');
    if (!container) {
      console.error('Could not find mermaid container');
      return;
    }
    
    // State variables
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let translateX = 0;
    let translateY = 0;
    let scale = 1;
    
    // Make sure the SVG can be transformed
    svgElement.style.transformOrigin = '0 0';
    
    // Set cursor style
    container.style.cursor = 'grab';
    
    // Apply transform
    function applyTransform() {
      svgElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
    
    // Mouse wheel zoom
    container.addEventListener('wheel', function(e) {
      e.preventDefault();
      
      // Determine zoom direction
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const newScale = Math.max(0.1, Math.min(5, scale + delta));
      
      // Get mouse position relative to container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate new position to zoom at mouse point
      if (newScale !== scale) {
        // Calculate mouse position relative to current transform
        const mouseRelativeX = (mouseX - translateX) / scale;
        const mouseRelativeY = (mouseY - translateY) / scale;
        
        // Calculate new position
        translateX = mouseX - mouseRelativeX * newScale;
        translateY = mouseY - mouseRelativeY * newScale;
        
        scale = newScale;
        applyTransform();
      }
    }, { passive: false });
    
    // Mouse drag panning
    container.addEventListener('mousedown', function(e) {
      if (e.button === 0) { // Left mouse button
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        container.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });
    
    document.addEventListener('mousemove', function(e) {
      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        
        translateX += dx;
        translateY += dy;
        
        lastX = e.clientX;
        lastY = e.clientY;
        
        applyTransform();
        e.preventDefault();
      }
    });
    
    document.addEventListener('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = 'grab';
      }
    });
    
    // Double-click to reset
    container.addEventListener('dblclick', function() {
      scale = 1;
      translateX = 0;
      translateY = 0;
      applyTransform();
    });
    
    // Touch events for mobile
    container.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
      if (isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastX;
        const dy = e.touches[0].clientY - lastY;
        
        translateX += dx;
        translateY += dy;
        
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        
        applyTransform();
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('touchend', function() {
      isDragging = false;
    });
    
    // Apply initial transform
    applyTransform();
  }
})(); 