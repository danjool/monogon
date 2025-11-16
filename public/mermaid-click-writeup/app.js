// Mermaid initialization
mermaid.initialize({
    theme: 'dark',
    securityLevel: 'loose'
});

window.showAlert = function(message) {
    alert(`${message}\n\nThis demonstrates ER diagram click callbacks!`);
};

// Parser visualization
let animator = null;
let isVisualizationMode = false;

function parseParserDemo() {
    const inputTextarea = document.getElementById('parser-input');
    const input = inputTextarea.value;

    if (typeof parser === 'undefined') {
        alert('ERROR: Parser not loaded. Make sure generated/parser.js exists.');
        return;
    }

    parser.yy = erDb;
    const instrumentor = new Instrumentor(parser);

    try {
        erDb.clear();
        const { result, events, dbSnapshots } = instrumentor.parse(input);

        const viz = new Visualizer('visualizationContent');
        const eventsPanel = document.getElementById('events');
        const dbPanel = document.getElementById('database');

        animator = new Animator(input, events, dbSnapshots, viz, eventsPanel, dbPanel, erDb);

        document.getElementById('inputContent').classList.add('hidden');
        document.getElementById('visualizationContent').classList.remove('hidden');
        isVisualizationMode = true;

        document.getElementById('parseButton').textContent = 'Edit';
        document.getElementById('parseButton').onclick = editParserDemo;
        document.getElementById('resetButton').classList.remove('hidden');
        document.getElementById('prevButton').classList.remove('hidden');
        document.getElementById('nextButton').classList.remove('hidden');

        animator.reset();
    } catch (e) {
        alert(`ERROR: ${e.message}`);
    }
}

function editParserDemo() {
    document.getElementById('inputContent').classList.remove('hidden');
    document.getElementById('visualizationContent').classList.add('hidden');
    isVisualizationMode = false;

    document.getElementById('events').innerHTML = '<div class="panel-header"><h3 style="margin: 0;">Parse Events</h3></div>';
    document.getElementById('database').innerHTML = '<div class="panel-header"><h3 style="margin: 0;">ER Database</h3></div>';

    document.getElementById('parseButton').textContent = 'Parse';
    document.getElementById('parseButton').onclick = parseParserDemo;
    document.getElementById('resetButton').classList.add('hidden');
    document.getElementById('prevButton').classList.add('hidden');
    document.getElementById('nextButton').classList.add('hidden');

    animator = null;
}

function stepForward() {
    if (animator) {
        animator.stepForward();
    }
}

function stepBackward() {
    if (animator) {
        animator.stepBackward();
    }
}

function resetParserDemo() {
    if (animator) {
        animator.reset();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!animator || !isVisualizationMode) return;
    if (e.target.tagName === 'TEXTAREA') return;

    switch(e.key) {
        case 'ArrowRight':
            e.preventDefault();
            stepForward();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            stepBackward();
            break;
        case 'r':
        case 'R':
            e.preventDefault();
            resetParserDemo();
            break;
    }
});
