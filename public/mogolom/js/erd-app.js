// Page glue for erd.html: deterministic ERD optimization via the ErdProto
// bundle (built from proto/ — see proto/README.md and proto/TRANSPLANT.md).
// Replaces the old render-and-guess loop (erd-optimizer.js,
// erd-svg-analyzer.js, erd-syntax-swapper.js, erd-example-manager.js).

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  er: {
    useMaxWidth: false,
    diagramPadding: 20
  }
});

// DOM Elements
const codeEditor = document.getElementById('code-editor');
const diagram = document.getElementById('diagram');
const optimizeBtn = document.getElementById('optimize-btn');
const stopBtn = document.getElementById('stop-btn');
const scoreDisplay = document.getElementById('score');
const edgeEdgeCount = document.getElementById('edge-edge-count');
const edgeNodeCount = document.getElementById('edge-node-count');
const methodDisplay = document.getElementById('method');
const iterationsCount = document.getElementById('iteration-count');

// Same weights the page has always used for the headline score.
const EDGE_EDGE_WEIGHT = 10;
const EDGE_NODE_WEIGHT = 1;

// State
let isOptimizing = false;
let cancelled = false;
let renderSeq = 0;

function showScore(s) {
  scoreDisplay.textContent = s.edgeEdge * EDGE_EDGE_WEIGHT + s.edgeNode * EDGE_NODE_WEIGHT;
  edgeEdgeCount.textContent = s.edgeEdge;
  edgeNodeCount.textContent = s.edgeNode;
}

// Predicted score of whatever is in the editor (replica dagre layout — no
// browser render involved; measured-SVG counts arrive with Tier 2).
function scoreEditor() {
  try {
    showScore(ErdProto.scoreErd(ErdProto.parseErd(codeEditor.value)));
  } catch (e) { /* best-effort while typing */ }
}

async function renderDiagram() {
  const code = codeEditor.value;
  const id = `rendered-diagram-${++renderSeq}`;
  try {
    const { svg } = await mermaid.render(id, code);
    diagram.innerHTML = svg;

    const svgElement = diagram.querySelector('svg');
    if (svgElement) {
      svgElement.removeAttribute('width');
      svgElement.removeAttribute('height');
      svgElement.style.width = '100%';
      svgElement.style.height = 'auto';
      svgElement.style.maxHeight = '100%';
      svgElement.style.display = 'block';
      svgElement.style.margin = '0 auto';

      // Pad the viewBox so the diagram is fully visible in the container.
      const svgBBox = svgElement.getBBox();
      const paddingX = Math.max(20, diagram.clientWidth * 0.05);
      const paddingY = Math.max(20, diagram.clientHeight * 0.05);
      svgElement.setAttribute(
        'viewBox',
        `${svgBBox.x - paddingX} ${svgBBox.y - paddingY} ` +
        `${svgBBox.width + paddingX * 2} ${svgBBox.height + paddingY * 2}`
      );

      diagram.style.height = '100%';
      diagram.style.overflow = 'hidden';
    }

    scoreEditor();
  } catch (error) {
    console.error('Error rendering diagram:', error);
    diagram.innerHTML = '<div style="color: red; padding: 1rem;">Error rendering diagram</div>';
    // mermaid.render leaves an orphaned error element behind on failure
    document.getElementById('d' + id)?.remove();
  }
}

// Expose for anything else on the page (examples dropdown uses it directly)
window.renderDiagram = renderDiagram;

async function startOptimization() {
  const code = codeEditor.value.trim();
  if (!code || isOptimizing) return;

  optimizeBtn.classList.remove('pulse-until-click');
  isOptimizing = true;
  cancelled = false;
  optimizeBtn.disabled = true;
  codeEditor.disabled = true;
  stopBtn.disabled = false;
  iterationsCount.textContent = '0';
  methodDisplay.textContent = 'searching…';

  try {
    const result = await ErdProto.optimize(code, {
      yieldEvery: 20,
      isCancelled: () => cancelled,
      onProgress: (p) => {
        iterationsCount.textContent = p.evals;
        showScore(p.best);
      },
    });

    codeEditor.value = result.bestCode;
    await renderDiagram();
    showScore(result.bestScore);
    iterationsCount.textContent = result.evals;
    methodDisplay.textContent =
      `${result.method} · ${(result.ms / 1000).toFixed(1)}s${cancelled ? ' (stopped early)' : ''}`;
  } catch (err) {
    console.error('Optimization failed:', err);
    methodDisplay.textContent = 'failed: ' + err.message;
  }

  isOptimizing = false;
  optimizeBtn.disabled = false;
  codeEditor.disabled = false;
  stopBtn.disabled = true;
}

function stopOptimization() {
  cancelled = true;
}

// Setup resizable panes
const resizer = document.getElementById('resizer');
const leftPane = document.querySelector('.left-pane');
const rightPane = document.querySelector('.right-pane');

let x = 0;
let leftWidth = 40; // Default to 40% for left pane (40/60 split)

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

// Initialize the application
let initialized = false;
function init() {
  if (initialized) return;
  initialized = true;

  setInitialPaneSizes();
  resizer.addEventListener('mousedown', initResize);

  let renderTimer = null;
  codeEditor.addEventListener('input', () => {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderDiagram, 300);
  });

  optimizeBtn.addEventListener('click', startOptimization);
  stopBtn.addEventListener('click', stopOptimization);
  stopBtn.disabled = true;

  // Examples dropdown from the bundled corpus (single source of truth)
  const examplesList = document.getElementById('examples-list');
  ErdProto.examples.forEach((ex) => {
    const button = document.createElement('button');
    button.textContent = ex.name;
    button.addEventListener('click', () => {
      codeEditor.value = ex.code;
      renderDiagram();
    });
    examplesList.appendChild(button);
  });

  // Load default example
  codeEditor.value = ErdProto.examples[0].code;
  renderDiagram();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
}
