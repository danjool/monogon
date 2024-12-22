import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const TERRAIN_CHUNK_SIZE = 100;
const TERRAIN_RESOLUTION = 25;
const chunks = new Map();

export function getChunkKey(x, z) {
  return `${Math.floor(x/TERRAIN_CHUNK_SIZE)},${Math.floor(z/TERRAIN_CHUNK_SIZE)}`;
}

function generateTerrainData(chunkX, chunkZ) {
  const heightData = Array(TERRAIN_RESOLUTION + 1).fill().map(() => 
    Array(TERRAIN_RESOLUTION + 1).fill(0)
  );    
  for (let i = 0; i <= TERRAIN_RESOLUTION; i++) {
    for (let j = 0; j <= TERRAIN_RESOLUTION; j++) {
      const worldX = chunkX * TERRAIN_RESOLUTION + i;
      const worldZ = chunkZ * TERRAIN_RESOLUTION + j;
      heightData[i][j] = Math.cos(worldX/TERRAIN_RESOLUTION * Math.PI * 4) + 
                         Math.cos(worldZ/TERRAIN_RESOLUTION * Math.PI * 4) * 1;
    }
  }
  return heightData;
}

export function createTerrainChunk(chunkX, chunkZ, scene, world, groundMaterial) {
  const heightData = generateTerrainData(chunkX, chunkZ);
  const elementSize = TERRAIN_CHUNK_SIZE / TERRAIN_RESOLUTION;
  
  const terrainShape = new CANNON.Heightfield(heightData, { elementSize });
  const terrainBody = new CANNON.Body({ mass: 0, material: groundMaterial });
  terrainBody.addShape(terrainShape);
  terrainBody.position.set(
    chunkX * TERRAIN_CHUNK_SIZE,
    -2,
    chunkZ * TERRAIN_CHUNK_SIZE
  );
  terrainBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(terrainBody);

  const geometry = new THREE.PlaneGeometry(
    TERRAIN_CHUNK_SIZE,
    TERRAIN_CHUNK_SIZE,
    TERRAIN_RESOLUTION,
    TERRAIN_RESOLUTION
  );
  
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = Math.floor((i/3) % (TERRAIN_RESOLUTION + 1));
    const y = Math.floor((i/3) / (TERRAIN_RESOLUTION + 1));
    vertices[i + 2] = heightData[x][y];
  }
  
  geometry.computeVertexNormals();
  const terrain = new THREE.Mesh(
    geometry,
    new THREE.MeshPhongMaterial({ color: 0x888866 })
  );
  terrain.position.copy(terrainBody.position);
  terrain.quaternion.copy(terrainBody.quaternion);
  scene.add(terrain);

  return { body: terrainBody, mesh: terrain };
}

export function checkAndCreateChunks(carBody, scene, world, groundMaterial) {
  const carX = carBody.position.x;
  const carZ = carBody.position.z;
  const chunkX = Math.floor(carX/TERRAIN_CHUNK_SIZE);
  const chunkZ = Math.floor(carZ/TERRAIN_CHUNK_SIZE);
   
  for(let i = -1; i <= 1; i++) {
    for(let j = -1; j <= 1; j++) {
      const key = getChunkKey((chunkX + i)*TERRAIN_CHUNK_SIZE, (chunkZ + j)*TERRAIN_CHUNK_SIZE);
      if(!chunks.has(key)) {
        chunks.set(key, createTerrainChunk(chunkX + i, chunkZ + j, scene, world, groundMaterial));
      }
    }
  }
}