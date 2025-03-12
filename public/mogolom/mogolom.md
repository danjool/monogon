# MOGOLOM - Monogon's Optimize Golem of Layouts of Mermaid

MOGOLOM is an advanced tool for optimizing the visual layout of Mermaid.js diagrams by reducing edge crossings and improving overall readability while preserving the semantic meaning of your diagrams.

## What is MOGOLOM?

MOGOLOM (Monogon's Optimize Golem of Layouts of Mermaid) is a specialized tool that automatically improves the visual clarity of Mermaid.js flowcharts by:

- Reducing where lines cross each other
- Minimizing where lines pass through nodes
- Preserving the semantic structure and meaning of diagrams
- Providing a plain, effective proof-of-concept interface for diagram optimization

## How It Works

MOGOLOM uses an optimization algorithm to:

1. Parse your Mermaid diagram code
2. Generate variations of the layout while preserving semantics
3. Render each variation and analyze the SVG output for intersections
4. Score layouts based on crossing counts and other metrics
5. Iteratively improve the layout to find the optimal arrangement
6. Present the optimized diagram with improved readability

## Features

- **Interactive Editor**: Edit your Mermaid code with real-time preview
- **One-Click Optimization**: Automatically improve diagram layouts
- **Stop Optimization**: Ability to stop the optimization process early
- **Example Library**: Pre-loaded examples to demonstrate capabilities
- **Statistics**: Track edge crossings and optimization progress
- **Responsive Design**: Resizable split-pane interface
- **Visual Feedback**: Diagrams include extra blue and red dots to indicate inappropriate crossings

## Usage

1. Enter or paste your Mermaid diagram code in the editor
2. Click "Optimize" to start the optimization process
3. Watch as MOGOLOM iteratively improves your diagram
4. If needed, click "Stop Optimization" to end the process early
5. At all times the optimized diagram will be displayed with statistics
6. Export via:
    - **Export to Mermaid live** opens another tab with code in url
    - Copy the optimized Mermaid code for use in your projects

## Technical Implementation

MOGOLOM consists of several key components:

- **UI Layer**: Modern interface with split-pane design (mogolom.html, CSS)
- **Rendering Engine**: Leverages Mermaid.js to render diagrams
- **SVG Analyzer**: Detects and quantifies diagram intersections, keeps track to pass to 
- **Syntax Swapper**: Generates semantically equivalent diagram variations, partly random, partly informed to weight by 'problematic' links and nodes
- **mogolom.js Optimization Engine**: Coordinates the optimization process
    - includes debug DE-optimization feature, which flips the functionality to tangle the graphs

## Project Structure
mogolom/
├── index.html # Main application interface
├── css/
│ └── style.css # Application styling
├── js/
│ ├── mogolom.js # Core optimization engine
│ ├── parse-flow.js # Mermaid flowchart parser
│ ├── svg-analyzer.js # SVG intersection detection
│ └── syntax-swapper.js # Layout variation generator
├── docs/
│ ├── FlowSyntax.md # Mermaid flowchart syntax reference
│ └── mogolom.md # Project documentation
└── examples/ # Sample diagram configurations

## Performance

The optimization algorithm is efficient enough to handle complex diagrams with many nodes and edges. The number of iterations can be adjusted based on diagram complexity and desired optimization level.

## Known flaws
### Mermaid
Mermaid doesn't actually support backwards arrows like <---
Workaround found in FlowSyntax.md, using invisible ~~~ arrows.