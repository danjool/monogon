export const particlesConfig = {
    // to remove from menu, include no label property
    // Simulation Core
    simulationSize: { value: 512, min: 64, max: 512, step: 64, label: "Particle Count²" },
    bounds: { value: 500000, min: 100000, max: 2000000, step: 50000 },
    simSpeed: { value: 1.0, min: 0.05, max: 2.0, step: 0.05, label: "Simulation Speed" },

    // Particle Properties
    particleSize: { value: 0.05, min: 0.01, max: 0.2, step: 0.01, label: "Particle Size" },
    particleLifespan: { value: 20000000, min: 1000000, max: 50000000, step: 1000000, label: "Lifespan" },
    colorIntensity: { value: 15.0, min: 1.0, max: 50.0, step: 1.0, label: "Color Intensity" },

    // Flow Dynamics
    flowSpeed: { value: 0.40, min: 0.1, max: 5.0, step: 0.1, label: "Flow Speed" },
    turbulence: { value: 18.0, min: 10, max: 500, step: 10, label: "Turbulence" },
    noiseScale: { value: .2, min: 0.1, max: 10.0, step: 0.1, label: "Noise Scale" },
    vortexScale: { value: 1000.2, min: 0.1, max: 50000.0, step: 0.1, label: "Vortex Scale" },
    damping: { value: 0.98, min: 0.9, max: 1.0, step: 0.001, label: "Velocity Damping" },

    // Advanced Flow
    vortexStrength: { value: 200.8, min: 50, max: 1000, step: 25, label: "Vortex Strength" },
    vortexCount: { value: 3, min: 1, max: 8, step: 1, label: "Vortex Count" },
    waveAmplitude: { value: 1.4, min: 0.1, max: 5.0, step: 0.1, label: "Wave Amplitude" },
    waveFrequency: { value: 0.015, min: 0.01, max: 0.2, step: 0.001, label: "Wave Frequency" },
    noiseAmplitude: { value: 0.03, min: 0.005, max: 0.1, step: 0.005, label: "Noise Amplitude" },
    mixingRate: { value: 0.005, min: 0.001, max: 0.02, step: 0.001, label: "Flow Mixing Rate" },

    // Emission Properties  
    emissionRate: { value: 0.1, min: 0.1, max: 50.0, step: 0.1, label: "Emission Rate" }
};