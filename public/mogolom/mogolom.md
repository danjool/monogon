# MOGOLOM - Monogon's Optimize Golem of Layouts of Mermaid

MOGOLOM is an advanced tool for optimizing the visual layout of Mermaid.js diagrams by reducing edge crossings and improving overall readability while preserving the semantic meaning of your diagrams.

## What is MOGOLOM?

MOGOLOM (Monogon's Optimize Golem of Layouts of Mermaid) is a specialized tool that automatically improves the visual clarity of Mermaid.js flowcharts by:

- Reducing where lines cross each other
- Minimizing where lines pass through nodes
- Preserving the semantic structure and meaning of diagrams
- Providing a plain, effective proof-of-concept interface for diagram optimization

## How It Works

MOGOLOM uses an adaptive optimization algorithm to:

1. Parse your Mermaid diagram code into a manipulatable tree structure
2. Generate variations of the layout while preserving semantics using multiple scrambling strategies:
   - Node position scrambling (prioritizing nodes involved in problematic crossings)
   - Edge order scrambling (with focus on problematic edges)
   - Strategic invisible edge manipulation (both random and targeted)
3. Render each variation and analyze the SVG output for intersections
4. Score layouts based on crossing counts and other metrics
5. Adaptively adjust scrambling tactics based on:
   - Number of iterations without improvement
   - Current score of the layout
   - crossings detected
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

- **UI Layer**: Modern interface with split-pane design (index.html, CSS)
- **Rendering Engine**: Leverages Mermaid.js to render diagrams
- **SVG Analyzer**: Detects and quantifies diagram intersections
- **Syntax Manipulation**:
  - Tree Parser: Converts Mermaid syntax to manipulatable structure
  - Modular Scramblers:
    - `node-scrambler.js`: Handles node position changes
    - `edge-scrambler.js`: Manages edge order manipulation
    - `invisible-edge-scrambler.js`: Strategic invisible edge placement
  - Tree to Mermaid: Converts back to valid Mermaid syntax
- **Adaptive Optimization**: Adjusts scrambling tactics based on progress

## Project Structure
```
mogolom/
├── index.html           # Main application interface
├── css/
│   └── mogolom.css     # Application styling
├── js/
│   ├── parse-flow.js   # Mermaid flowchart parser
│   ├── scramblers/     # Modular scrambling strategies
│   │   ├── node-scrambler.js
│   │   ├── edge-scrambler.js
│   │   └── invisible-edge-scrambler.js
│   ├── flow-tree-to-mmd.js  # Tree to Mermaid converter
│   ├── svg-analyzer.js      # SVG intersection detection
│   ├── syntax-swapper.js    # Orchestrates scrambling strategies
│   └── example-manager.js   # Sample diagram management
├── docs/
│   ├── FlowSyntax.md       # Mermaid flowchart syntax reference
│   └── mogolom.md          # Project documentation
└── examples/               # Sample diagram configurations
```

## Performance

The optimization algorithm is efficient enough to handle complex diagrams with many nodes and edges. The number of iterations can be adjusted based on diagram complexity and desired optimization level.

## Known flaws
### Mermaid
Mermaid doesn't actually support backwards arrows like <---
Workaround found in FlowSyntax.md, using invisible ~~~ arrows.