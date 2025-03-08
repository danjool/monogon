# MOGOLOM - Monogon's Optimizing Golem of Layouts of Mermaid

MOGOLOM is an advanced tool for optimizing the visual layout of Mermaid.js diagrams by reducing edge crossings and improving overall readability while preserving the semantic meaning of your diagrams.

## What is MOGOLOM?

MOGOLOM (Monogon's Optimizing Golem of Layouts of Mermaid) is a specialized tool that automatically improves the visual clarity of Mermaid.js flowcharts by:

- Reducing edge-to-edge intersections (where lines cross each other)
- Minimizing edge-to-node intersections (where lines pass through nodes)
- Preserving the semantic structure and meaning of your diagrams
- Providing a modern, user-friendly interface for diagram optimization

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
- **Detailed Statistics**: Track edge crossings and optimization progress
- **Responsive Design**: Resizable split-pane interface
- **Visual Feedback**: Progress bar and completion notifications

## Usage

1. Enter or paste your Mermaid diagram code in the editor
2. Click "Optimize Layout" to start the optimization process
3. Watch as MOGOLOM iteratively improves your diagram
4. If needed, click "Stop Optimization" to end the process early
5. When complete, the optimized diagram will be displayed with statistics
6. Copy the optimized Mermaid code for use in your projects

## Technical Implementation

MOGOLOM consists of several key components:

- **UI Layer**: Modern interface with split-pane design (mogolom.html, CSS)
- **Rendering Engine**: Leverages Mermaid.js to render diagrams
- **SVG Analyzer**: Detects and quantifies diagram intersections
- **Syntax Swapper**: Generates semantically equivalent diagram variations
- **Optimization Engine**: Coordinates the optimization process

## Project Structure

```
├── mogolom.html       # Main application interface
├── index.html         # Alternative/legacy interface
├── mogolom.js         # Core optimization logic
├── css/
│   └── mogolom.css    # Styling for the application
├── js/
│   ├── svg-analyzer.js      # Detects diagram intersections
│   ├── syntax-swapper.js    # Generates diagram variations
│   ├── example-manager.js   # Manages example diagrams
│   └── mermaid-renderer.js  # Handles diagram rendering
```

## Performance

The optimization algorithm is efficient enough to handle complex diagrams with many nodes and edges. The number of iterations can be adjusted based on diagram complexity and desired optimization level.