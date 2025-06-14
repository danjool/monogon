export const visualsConfig = {
    // Trajectory Prediction
    predictionSteps: { value: 1000, min: 100, max: 3000, step: 100, label: "Prediction Steps" },
    markerInterval: { value: 20, min: 5, max: 50, step: 5, label: "Marker Interval" },
    markerSize: { value: 0.5, min: 0.1, max: 2.0, step: 0.1, label: "Marker Size" },
    markerOpacity: { value: 0.0, min: 0.0, max: 1.0, step: 0.1, label: "Marker Opacity" },
    showTrajectory: { value: 1, min: 0, max: 1, step: 1, label: "Show Trajectory" },

    // Debug Visualization
    debugCircleOpacity: { value: 0.8, min: 0.0, max: 1.0, step: 0.1, label: "Debug Circle Opacity" },
    debugBufferSize: { value: 60, min: 10, max: 200, step: 10, label: "Debug Buffer Size" },
    showTurnDebug: { value: 0, min: 0, max: 1, step: 1, label: "Show Turn Debug" },
    showDebugCube: { value: 1, min: 0, max: 1, step: 1, label: "Show Debug Cube" },
    debugCubeOpacity: { value: 0.8, min: 0.1, max: 1.0, step: 0.1, label: "Debug Cube Opacity" },

    // Minesweeper Visual
    minesweeperScale: { value: 200, min: 50, max: 500, step: 25, label: "Minesweeper Scale" },
    cellSize: { value: 0.9, min: 0.5, max: 1.5, step: 0.1, label: "Cell Size" },
    sphereRadius: { value: 0.1, min: 0.05, max: 0.3, step: 0.01, label: "Number Sphere Size" },
    floatAmplitude: { value: 0.05, min: 0.01, max: 0.2, step: 0.01, label: "Float Amplitude" },
    attractionSpeed: { value: 0.03, min: 0.01, max: 0.1, step: 0.005, label: "Ball Attraction Speed" }
};