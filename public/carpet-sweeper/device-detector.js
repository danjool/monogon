export class DeviceDetector {
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
    }
    
    static hasGamepad() {
        return !!navigator.getGamepads;
    }
    
    static supportsOrientation() {
        return typeof DeviceOrientationEvent !== 'undefined';
    }
    
    static getInputCapabilities() {
        return {
            mobile: this.isMobile(),
            gamepad: this.hasGamepad(),
            orientation: this.supportsOrientation(),
            touch: 'ontouchstart' in window
        };
    }
    
    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }
    
    static needsOrientationPermission() {
        return this.isIOS() && typeof DeviceOrientationEvent.requestPermission === 'function';
    }
}