export const cameraConfig = {
    // Camera positioning
    cameraDistance: { value: 14, min: 5, max: 50, step: 1, label: "Follow Distance" },
    screenOffset: { value: 3.25, min: 0, max: 10, step: 0.25, label: "Screen Offset" },

    // Camera sensitivity
    cameraYawSensitivity: { value: 2.0, min: 0.1, max: 3.0, step: 0.1, label: "Yaw Sensitivity" },
    cameraPitchSensitivity: { value: 1.0, min: 0.1, max: 2.0, step: 0.1, label: "Pitch Sensitivity" },

    // Gamepad camera input scaling
    gamepadCameraYawScale: { value: 0.02, min: 0.005, max: 0.1, step: 0.005, label: "Gamepad Yaw Scale" },
    gamepadCameraPitchScale: { value: 0.01, min: 0.005, max: 0.05, step: 0.005, label: "Gamepad Pitch Scale" },

    // Camera behavior
    lookAheadDistance: { value: 0, min: 0, max: 5, step: 0.1, label: "Look Ahead Distance" },
    followSmoothing: { value: 1.0, min: 0.1, max: 1.0, step: 0.1, label: "Follow Smoothing" }
};