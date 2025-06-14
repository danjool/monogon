export const carpetConfig = {
    // Speed & Altitude Control
    equilibriumSpeed: { value: 1000, min: 0, max: 5000, step: 50, label: "Cruise Speed" },
    minSpeed: { value: 0.1, min: 0, max: 50, step: 1, label: "Min Speed" },
    maxSpeed: { value: 100000, min: 1000, max: 200000, step: 1000, label: "Max Speed" },
    equilibriumAltitude: { value: 1000, min: 100, max: 10000, step: 50, label: "Target Altitude" },
    gravity: { value: 90.8, min: 10, max: 200, step: 1, label: "Gravity Strength" },
    speedInfluenceOnPitch: { value: 0.02, min: 0.001, max: 0.1, step: 0.001, label: "Speed→Pitch Influence" },

    // Pitch Control
    pitchSensitivity: { value: 0.02, min: 0.005, max: 0.1, step: 0.001, label: "Pitch Input Rate" },
    maxPitch: { value: 85, min: 30, max: 90, step: 5, label: "Max Pitch Angle" },
    pitchMomentumDamping: { value: 0.95, min: 0.8, max: 0.999, step: 0.001, label: "Pitch Damping" },
    stallRecoveryForce: { value: 0.1, min: 0.01, max: 0.5, step: 0.01, label: "Stall Recovery" },
    maxPitchMomentum: { value: 0.05, min: 0.01, max: 0.2, step: 0.01, label: "Max Pitch Momentum" },

    // Turn & Roll Control
    turnInputRate: { value: 0.04, min: 0.01, max: 0.5, step: 0.01, label: "Turn Input Rate" },
    turnMomentumDamping: { value: 1.0, min: 0.9, max: 1.0, step: 0.001, label: "Turn Damping" },
    maxTurnMomentum: { value: 0.05, min: 0.01, max: 0.1, step: 0.001, label: "Max Turn Momentum" },
    rollFactor: { value: 20, min: 5, max: 50, step: 1, label: "Roll Visualization" },
    maxRoll: { value: 40, min: 10, max: 90, step: 5, label: "Max Roll Angle" },
    rollRecoveryRate: { value: 0.9, min: 0.7, max: 0.99, step: 0.01, label: "Roll Recovery" },

    // Boost System
    boostRate: { value: 250, min: 50, max: 1000, step: 25, label: "Boost Rate" },
    triggerSensitivity: { value: 1.0, min: 0.1, max: 3.0, step: 0.1, label: "Trigger Sensitivity" },
    triggerResponseCurve: { value: 2.0, min: 1.0, max: 4.0, step: 0.1, label: "Trigger Curve" },
    maxTriggerEffect: { value: 1.0, min: 0.5, max: 2.0, step: 0.1, label: "Max Trigger Effect" },
    triggerDeadzone: { value: 0.05, min: 0.0, max: 0.2, step: 0.01, label: "Trigger Deadzone" },

    // Fine Physics Tuning
    verticalSpeedInfluence: { value: 0.000004, min: 0.000001, max: 0.00002, step: 0.000001, label: "Vertical Speed Factor" },
    speedNormalization: { value: 1000, min: 100, max: 5000, step: 100, label: "Speed Normalization" },
    targetPitchMultiplier: { value: 1.25, min: 0.5, max: 3.0, step: 0.1, label: "Target Pitch Factor" },
    momentumThreshold: { value: 0.0005, min: 0.0001, max: 0.002, step: 0.0001, label: "Momentum Threshold" },

    // World Properties (fixed - no longer adjustable)
    worldRadius: { value: 100000, min: 100000, max: 100000, step: 0, label: "World Size (Fixed)" }
};