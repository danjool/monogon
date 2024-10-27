// TextOverlaySystem.js
import * as THREE from 'three';

export class TextOverlaySystem {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.overlays = [];
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.pointerEvents = 'none';
    document.body.appendChild(this.container);

    // Bind the update method to this instance
    this.update = this.update.bind(this);

    // Add resize event listener
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  addFixedOverlay(text, x, y, style = {
    fontSize: '22px', textAlign: 'left', width: '300px'
  }) {
    const element = document.createElement('div');
    element.textContent = text;
    element.style.position = 'absolute';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.width = '200px';
    this.applyStyle(element, style);
    this.container.appendChild(element);

    const overlay = { element, type: 'fixed' };
    this.overlays.push(overlay);
    return overlay;
  }

  addObject3DOverlay(text, object3D, offset = { x: 0, y: 0 }, style = {
    // maxWidth: '400px', whiteSpace: 'normal' to get text to wrap
    fontSize: '22px', textAlign: 'left'
  }) {
    const element = document.createElement('div');
    element.textContent = text;
    element.style.position = 'absolute';
    element.style.whiteSpace = 'nowrap';
    this.applyStyle(element, style);
    this.container.appendChild(element);

    const overlay = { element, object3D, offset, type: '3D' };
    this.overlays.push(overlay);
    return overlay;
  }

  applyStyle(element, style) {
    Object.assign(element.style, {
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '5px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '3px',
      ...style
    });
  }

  removeOverlay(overlay) {
    const index = this.overlays.indexOf(overlay);
    if (index !== -1) {
      this.container.removeChild(overlay.element);
      this.overlays.splice(index, 1);
    }
  }

  removeAll3DOverlays() {
    for (const overlay of this.overlays) {
      if (overlay.type === '3D') {
        this.container.removeChild(overlay.element);
      }
    }
    this.overlays = this.overlays.filter(overlay => overlay.type !== '3D');
  }

  update() {
    const canvasRect = this.renderer.domElement.getBoundingClientRect();

    for (const overlay of this.overlays) {
      if (overlay.type === '3D') {
        const screenPosition = this.getScreenPosition(overlay.object3D, canvasRect);
        if (screenPosition) {
          overlay.element.style.left = `${screenPosition.x + overlay.offset.x}px`;
          overlay.element.style.top = `${screenPosition.y + overlay.offset.y}px`;
          overlay.element.style.display = 'block';
        }
      } else {
          overlay.element.style.display = 'none';
      }
    }
  }

  getScreenPosition(object3D, canvasRect) {
    const vector = new THREE.Vector3();
    object3D.updateMatrixWorld();
    vector.setFromMatrixPosition(object3D.matrixWorld);
    vector.project(this.camera);

    const x = (vector.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left;
    const y = (-vector.y * 0.5 + 0.5) * canvasRect.height + canvasRect.top;

    if (vector.z > 1) {
      return null; // Object is behind the camera
    }

    return { x, y };
  }

  onWindowResize() {
    this.update();
  }
}