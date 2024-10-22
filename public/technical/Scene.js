// Scene.js
import * as THREE from 'three';
import { SpriteText } from './SpriteText.js';

export class Scene extends THREE.Scene {
  constructor() {
    super();
    this.kids = [];
    this.appraisers = [];
    this.presentationArea;
    this.fog = new THREE.Fog(0x000000, 500, 10000);
    this.boxSize = 0.5;
    this.N = 20;
    this.arbitraryFactor = 10.0;
    this.presentationAreaSize = 20 * this.arbitraryFactor;
    this.targetZoneSizesImperial = [8, 7, 5, 2];
    this.targetZoneColors = [0x00ff00, 0x00cc00, 0x009900, 0xff6600];
    this.meshes = [];

    this.initLights();
    this.initPresentationArea();
    this.initTargetZones();
    this.initAssemblyZone();
    this.initAudienceZone();
    this.initAudienceMembers();
    this.initTeamChoiceElements();
    this.initStackables();
    this.initKidsAndAppraisers();
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0x666666);
    this.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.75);
    const distance = 20;
    directionalLight.position.set(distance, distance, distance);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.left = -distance;
    directionalLight.shadow.camera.right = distance;
    directionalLight.shadow.camera.top = distance;
    directionalLight.shadow.camera.bottom = -distance;
    directionalLight.shadow.camera.far = 3 * distance;
    directionalLight.shadow.camera.near = distance;
    this.add(directionalLight);
  }

  initPresentationArea() {
    const presentationAreaGeometry = new THREE.PlaneBufferGeometry(this.presentationAreaSize, this.presentationAreaSize, 1, 1);
    presentationAreaGeometry.rotateX(-Math.PI / 2);
    const presentationAreaMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    this.presentationArea = new THREE.Mesh(presentationAreaGeometry, presentationAreaMaterial);
    this.presentationArea.position.z = -this.presentationAreaSize / 2 + this.targetZoneSizesImperial[0] * this.arbitraryFactor / 2;
    this.presentationArea.receiveShadow = true;
    this.add(this.presentationArea);
  }

  initTargetZones() {
    this.targetZoneSizesImperial.forEach((size, index) => {
      const targetZoneGeometry = new THREE.PlaneGeometry(size * this.arbitraryFactor, size * this.arbitraryFactor);
      const targetZoneMaterial = new THREE.MeshBasicMaterial({ color: this.targetZoneColors[index], side: THREE.DoubleSide, transparent: true, opacity: .9 });
      const targetZone = new THREE.Mesh(targetZoneGeometry, targetZoneMaterial);
      targetZone.rotation.x = Math.PI / 2;
      targetZone.position.y = 0.01 + index * 0.4;
      targetZone.renderOrder = -1;
      this.add(targetZone);
    });
  }

  initAssemblyZone() {
    const assemblyZoneHeight = .1;
    const assemblyZoneGeometry = new THREE.BoxGeometry(this.targetZoneSizesImperial[3] * this.arbitraryFactor, assemblyZoneHeight, this.targetZoneSizesImperial[3] * this.arbitraryFactor);
    const assemblyZoneMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.5 });
    this.assemblyZone = new THREE.Mesh(assemblyZoneGeometry, assemblyZoneMaterial);
    this.assemblyZone.position.y = assemblyZoneHeight / 2;
    this.assemblyZone.visible = true;
    this.add(this.assemblyZone);
  }

  initAudienceZone() {
    const audienceGeometry = new THREE.PlaneGeometry(this.presentationAreaSize * .8, this.presentationAreaSize * .2);
    const audienceMaterial = new THREE.MeshBasicMaterial({ color: 0x444499, side: THREE.DoubleSide });
    const audienceMesh = new THREE.Mesh(audienceGeometry, audienceMaterial);
    audienceMesh.rotation.x = Math.PI / 2;
    audienceMesh.position.set(0, 0.01, this.presentationAreaSize / 2 - this.targetZoneSizesImperial[0] * this.arbitraryFactor / 2);
    this.add(audienceMesh);
  }

  initAudienceMembers() {
    const x = 24;
    const y = 12;
    for (let i = 0; i < x; i++) {
      for (let j = 0; j < y; j++) {
        const audienceOptions = {
          color: '#888888',
          height: this.arbitraryFactor * 0.5 * (1 + Math.random() * 0.5),
          width: this.arbitraryFactor * 0.5 * 0.4,
          areaWidth: this.presentationAreaSize * 0.8,
          areaDepth: this.presentationAreaSize * 0.2
        };
        const audienceMember = this.createPersonSprite(audienceOptions);
        audienceMember.position.set(
          (i - x / 2) * audienceOptions.areaWidth / x + 3,
          audienceOptions.height / 2,
          (j - y / 2) * audienceOptions.areaDepth / y + this.presentationAreaSize / 2 - this.targetZoneSizesImperial[0] * this.arbitraryFactor / 2
        );
        this.add(audienceMember);
      }
    }
  }

  createPersonSprite({ color = '#FFFFFF', height = 1, width = 0.6, headRatio = 0.25 }) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    const headSize = canvas.height * headRatio;
    const bodyHeight = canvas.height - headSize;
    
    ctx.beginPath();
    ctx.arc(canvas.width / 2, headSize / 2, headSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, headSize);
    ctx.lineTo(canvas.width / 2, headSize + bodyHeight * 0.6);
    ctx.lineTo(canvas.width / 3, canvas.height - 2);
    ctx.moveTo(canvas.width / 2, headSize + bodyHeight * 0.6);
    ctx.lineTo(canvas.width * 2 / 3, canvas.height - 2);
    ctx.moveTo(canvas.width / 4, headSize + bodyHeight * 0.1);
    ctx.lineTo(canvas.width * 3 / 4, headSize + bodyHeight * 0.1);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(width, height, 1);
    
    return sprite;
  }

  initTeamChoiceElements() {
    const icosahedronGeometry = new THREE.IcosahedronGeometry(1);
    const icosahedronMaterial = new THREE.MeshBasicMaterial({ color: 0x3498db });
    this.teamChoiceElement1 = new THREE.Mesh(icosahedronGeometry, icosahedronMaterial);
    this.teamChoiceElement1.position.set(-5, 0.5, -64);
    this.add(this.teamChoiceElement1);

    const dodecahedronGeometry = new THREE.DodecahedronGeometry(1);
    const dodecahedronMaterial = new THREE.MeshBasicMaterial({ color: 0xf4d84b });
    this.teamChoiceElement2 = new THREE.Mesh(dodecahedronGeometry, dodecahedronMaterial);
    this.teamChoiceElement2.position.set(5, 0.5, -64);
    this.add(this.teamChoiceElement2);
  }

  initKidsAndAppraisers() {
    const kidColors = ['#FF0000', '#00FF00', '#0000FF'];
    const appraiserColors = ['#FF00FF', '#DD00DD'];
    const kidHeight = 0.5 * this.arbitraryFactor;
    const appraiserHeight = 1.0 * this.arbitraryFactor;

    kidColors.forEach((color, index) => {
      const kid = this.createPersonSprite({ color, height: kidHeight, width: kidHeight * 0.6 });
      kid.position.set(-5 + index * 2, kidHeight / 2, -5);
      this.kids.push(kid);
      this.add(kid);
    });

    appraiserColors.forEach((color, index) => {
      const appraiser = this.createPersonSprite({ color, height: appraiserHeight, width: appraiserHeight * 0.5 });
      appraiser.position.set(-2 + index * 4, appraiserHeight / 2, 5);
      this.appraisers.push(appraiser);
      this.add(appraiser);
    });
  }

  initStackables() {
    const stackableGeometry = new THREE.BoxBufferGeometry(this.boxSize * 2.0, this.boxSize * 2.0, this.boxSize * 2.0, 10, 10);
    // const haloGeometry = new THREE.RingBufferGeometry(0.6, 0.8, 32);
    // const haloMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });

    for (let i = 0; i < this.N; i++) {
      const numberTexture = this.createNumberTexture(i + 1);
      const stackableMaterial = new THREE.MeshPhongMaterial({ map: numberTexture });

      const stackableMesh = new THREE.Mesh(stackableGeometry, stackableMaterial);
      stackableMesh.castShadow = true;
      stackableMesh.userData.particlesEmitted = 0;

    //   const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
    //   haloMesh.position.set(0, -this.boxSize, 0);
    //   haloMesh.rotation.x = Math.PI / 2;
    //   cubeMesh.add(haloMesh);

      this.meshes.push(stackableMesh);
      this.add(stackableMesh);
    }
  }

  createNumberTexture(number) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'black';
    context.font = '48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(number, canvas.width / 2, canvas.height / 2);
    return new THREE.CanvasTexture(canvas);
  }

  updateMeshes(positions, quaternions) {
    for (let i = 0; i < this.meshes.length; i++) {
      this.meshes[i].position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      this.meshes[i].quaternion.set(quaternions[i * 4], quaternions[i * 4 + 1], quaternions[i * 4 + 2], quaternions[i * 4 + 3]);
    }
  }

  toggleAttractionVisuals() {
    this.meshes.forEach(mesh => {
      mesh.children[0].visible = !mesh.children[0].visible;
    });
  }
}