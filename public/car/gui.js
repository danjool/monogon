import { GUI } from 'dat.gui';
import { params } from './config.js';

export function setupGUI(groundMaterial, wheelMaterial, carBody, wheelBodies,   updateSprings) {
  const gui = new GUI();
  const physicsFolder = gui.addFolder('Physics');
  physicsFolder.add(params, 'groundFriction', 0, 1, 0.01).onChange(v => groundMaterial.friction = v);
  physicsFolder.add(params, 'wheelFriction', 0, 1, 0.01).onChange(v => wheelMaterial.friction = v);
  physicsFolder.add(params, 'maxSpeed', 10, 200);
  physicsFolder.add(params, 'acceleration', 0.1, 5);
  physicsFolder.add(params, 'steeringSpeed', 0.01, 1);
  physicsFolder.add(params, 'brakeTorque', 0.1, 5);
  physicsFolder.add(params, 'rollingResistance', 0.1, 2);
  physicsFolder.add(params, 'steeringReturn', 0.1, 2);
  physicsFolder.add(params, 'carMass', 0.1, 10).onChange(v => carBody.mass = v);
  physicsFolder.add(params, 'wheelMass', 0.1, 5).onChange(v => wheelBodies.forEach(wheel => wheel.mass = v));
  physicsFolder.add(params, 'maxSteeringAngle', 0.1, 1);
  physicsFolder.add(params, 'suspensionStiffness', .001, 1).onChange(updateSprings);
  physicsFolder.add(params, 'suspensionDamping', 0.1, 10).onChange(updateSprings);
  physicsFolder.add(params, 'springLength', 0.1, 2).onChange(updateSprings);
  physicsFolder.add(params, 'lateralStability', 0, 5).name('Grip Strength');
  physicsFolder.open();
}