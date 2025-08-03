import { DeviceDetector } from './device-detector.js';

export class LaunchScreen {
    constructor(inputManager, configs) {
        this.inputManager = inputManager;
        this.configs = configs;
        this.capabilities = DeviceDetector.getInputCapabilities();
        this.container = null;
        this.settings = {
            motionControls: true,
            lockLandscape: false
        };
    }
    
    async show() {
        return new Promise((resolve) => {
            this.container = this.createLaunchContainer();
            document.body.appendChild(this.container);
            
            if (this.capabilities.mobile) {
                this.showMobileLaunch(resolve);
            } else {
                this.showDesktopLaunch(resolve);
            }
        });
    }
    
    createLaunchContainer() {
        const container = document.createElement('div');
        container.id = 'launch-screen';
        container.className = 'launch-container';
        container.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            background: #000000;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: monospace;
        `;
        return container;
    }
    
    showMobileLaunch(resolve) {
        this.container.innerHTML = `
            <div class="launch-mobile">
                <h1 style="color: white; font-size: 24px; margin-bottom: 15px; text-align: center;">Flying Carpet</h1>
                <div class="controls-preview" style="margin: 15px 0; text-align: center;">
                    <div class="gesture-demo" style="display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: white;">
                        <span>Tilt Device to Fly</span>
                        <span>Tap Mines</span>
                        <span>Double-tap Empty Area to Recalibrate</span>
                    </div>
                </div>
                <div class="orientation-section" style="margin: 15px 0; text-align: center;">
                    <label style="color: white; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <input type="checkbox" id="enable-motion" checked style="transform: scale(1.2);"> 
                        Enable Motion Controls
                    </label>
                </div>
                <button id="start-flying" style="
                    width: 180px; height: 50px; font-size: 16px; font-weight: bold;
                    background: #4CAF50; color: white; border: none; border-radius: 25px;
                    margin-top: 20px; cursor: pointer;
                ">Start Flying</button>
            </div>
        `;
        
        const startBtn = this.container.querySelector('#start-flying');
        const motionCheckbox = this.container.querySelector('#enable-motion');
        
        startBtn.addEventListener('click', async () => {
            this.settings.motionControls = motionCheckbox.checked;
            
            startBtn.textContent = 'Initializing...';
            startBtn.disabled = true;
            
            if (this.settings.motionControls && this.capabilities.orientation) {
                const result = await this.inputManager.requestOrientationPermission();
                if (result.success) {
                    this.inputManager.enableDeviceOrientation();
                }
            }
            
            this.cleanup();
            resolve(this.settings);
        });
    }
    
    showDesktopLaunch(resolve) {
        this.container.innerHTML = `
            <div class="launch-desktop" style="text-align: center; color: white; max-width: 800px;">
                <h1 style="font-size: 36px; margin-bottom: 40px;">Flying Carpet Minesweeper</h1>
                <div class="controls-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
                    <div class="keyboard-controls">
                        <h3 style="margin-bottom: 20px;">Keyboard</h3>
                        <ul style="list-style: none; padding: 0; text-align: left; font-size: 14px; line-height: 1.6;">
                            <li><strong>W/S</strong> Pitch Up/Down</li>
                            <li><strong>A/D</strong> Turn Left/Right</li>
                            <li><strong>Q/E</strong> Boost/Brake</li>
                            <li><strong>Space</strong> Toggle Camera</li>
                            <li><strong>Tab</strong> Settings Menu</li>
                        </ul>
                    </div>
                    <div class="gamepad-controls">
                        <h3 style="margin-bottom: 20px;">Gamepad ${this.capabilities.gamepad ? '✓' : '(Not Detected)'}</h3>
                        <ul style="list-style: none; padding: 0; text-align: left; font-size: 14px; line-height: 1.6;">
                            <li><strong>Left Stick</strong> Turn/Pitch</li>
                            <li><strong>Right Stick</strong> Look Around</li>
                            <li><strong>RT</strong> Boost</li>
                            <li><strong>LT</strong> Brake</li>
                            <li><strong>Select</strong> Settings</li>
                        </ul>
                    </div>
                </div>
                <button id="start-flying" style="
                    width: 200px; height: 60px; font-size: 18px; font-weight: bold;
                    background: #4CAF50; color: white; border: none; border-radius: 30px;
                    cursor: pointer;
                ">Start Flying</button>
            </div>
        `;
        
        const startBtn = this.container.querySelector('#start-flying');
        startBtn.addEventListener('click', () => {
            this.cleanup();
            resolve(this.settings);
        });
    }
    
    
    cleanup() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}