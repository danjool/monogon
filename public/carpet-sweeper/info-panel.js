export class InfoPanel {
    constructor() {
        this.element = document.getElementById('info');
        this.updateCount = 0;
        this.makeResponsive();
    }
    
    makeResponsive() {
        if (this.element) {
            this.element.style.cssText = `
                position: absolute;
                color: white;
                background-color: rgba(0,0,0,0.7);
                padding: 1vh 1vw;
                font-size: 0.8vw;
                top: 1vh;
                left: 1vw;
                max-width: 25vw;
                border-radius: 0.5vh;
                border: 1px solid #333;
                font-family: monospace;
            `;
        }
    }
    
    update(carpet, gamepadActive, worldRadius, playerCount = 1) {
        // Update less frequently to avoid performance impact
        this.updateCount++;
        if (this.updateCount % 30 !== 0) return; // Update every 30 frames
        
        if (!this.element) return;
        
        const multiplayerStatus = playerCount > 1 ? 
            `<div style="margin-top: 1vh;"><strong>Multiplayer:</strong> <span style="float: right;">${playerCount} pilots</span></div>` : '';
        
        // Determine which controls to show based on input method
        const controlsSection = this.getControlsSection(gamepadActive);
        
        this.element.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span><strong>Altitude:</strong></span>
                <span>${carpet.currentAltitude.toFixed(1)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Distance from Center:</span>
                <span>${carpet.position.length().toFixed(1)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Distance to Wall:</span>
                <span>${(worldRadius - carpet.position.length()).toFixed(1)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Speed:</span>
                <span>${carpet.speed.toFixed(1)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Vertical Speed:</span>
                <span>${carpet.verticalSpeed.toFixed(1)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Horizontal Speed:</span>
                <span>${carpet.horizontalSpeed.toFixed(1)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Pitch:</span>
                <span>${(carpet.pitch * 180 / Math.PI).toFixed(1)}°</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Roll:</span>
                <span>${(carpet.roll * 180 / Math.PI).toFixed(1)}°</span>
            </div>
            ${multiplayerStatus}
            ${controlsSection}
        `;
    }
    
    getControlsSection(gamepadActive) {
        if (gamepadActive) {
            return `
                <div style="margin-top: 1vh; padding-top: 1vh; border-top: 1px solid #444;">
                    <strong>Gamepad Controls:</strong><br>
                    Left Stick: Turn/Pitch | Right Stick: Look Around<br>
                    Left/Right Trigger: Reverse/Boost | A,RB: Click Mines<br>
                    Select: Options Menu<br>
                    R: Reset Carpet
                </div>
            `;
        } else {
            return `
                <div style="margin-top: 1vh; padding-top: 1vh; border-top: 1px solid #444;">
                    <strong>Keyboard Controls:</strong><br>
                    WASD: Turn/Pitch | Mouse: Look Around<br>
                    Click: Interact with Mines<br>
                    R: Reset Carpet
                </div>
            `;
        }
    }
    
    showMessage(message, duration = 2000) {
        if (!this.element) return;
        
        const originalContent = this.element.innerHTML;
        this.element.innerHTML = `<strong>${message}</strong>`;
        
        setTimeout(() => {
            this.element.innerHTML = originalContent;
        }, duration);
    }
    
    showGamepadConnection(gamepadId) {
        this.showMessage(`Gamepad connected: ${gamepadId}`);
    }
    
    showGamepadDisconnection(gamepadId) {
        this.showMessage(`Gamepad disconnected: ${gamepadId}`);
    }
}