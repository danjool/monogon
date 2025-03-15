# Principia - Interactive Geometric Proof Visualization

Principia is a web-based application for interactive visualization of geometric proofs. It allows users to manipulate geometric elements and see the relationships between them in real-time.

## Project Structure

The project is organized into several modules:

### Core Components

- `EventEmitter.js`: Base class for event handling
- `Registry.js`: Manages all geometric elements
- `ProofLoader.js`: Loads proof data from various sources

### Geometry Components

- `GeometricElement.js`: Base class for all geometric elements
- `Point.js`: Represents a point in 2D space
- `Line.js`: Represents a line segment between two points
- `Circle.js`: Represents a circle with a center and radius
- `Triangle.js`: Represents a triangle formed by three points
- `Plane.js`: Represents a plane viewed from the side (as a line segment)

### Constraint Components

- `Constraint.js`: Base class for all constraints
- `PointOnCircle.js`: Keeps a point on a circle's circumference
- `Parallel.js`: Keeps two lines parallel
- `Perpendicular.js`: Keeps two lines perpendicular
- `PointOnLine.js`: Keeps a point on a line
- `FixedDistance.js`: Keeps two points at a fixed distance
- `AngleConstraint.js`: Maintains a specific angle between two lines

### Solver Components

- `DependencyGraph.js`: Tracks dependencies between elements
- `ConstraintSolver.js`: Resolves geometric constraints

### Rendering Components

- `CanvasRenderer.js`: Renders geometric elements on a canvas
- `HighlightManager.js`: Manages highlighting between text and canvas elements
- `Renderer.js`: Main rendering controller

### Interaction Components

- `InputHandler.js`: Handles user input for the canvas
- `DragManager.js`: Manages dragging operations
- `SelectionManager.js`: Manages element selection
- `InteractionManager.js`: Coordinates all interaction components

## Features

- Interactive manipulation of geometric elements
- Real-time constraint solving
- Bidirectional highlighting between text and geometric elements
- Support for various geometric constraints
- Responsive canvas rendering

## Usage

1. Open `index.html` in a web browser
2. Interact with the geometric elements on the canvas
3. Observe how the constraints are maintained as elements are moved
4. Hover over text elements to highlight corresponding geometric elements

## Development

The project uses ES6 modules and is designed to be run directly in modern browsers without a build step.

To add new geometric elements or constraints:

1. Create a new class extending the appropriate base class
2. Implement the required methods
3. Register the new class with the Registry

## License

This project is open source and available under the MIT License.
