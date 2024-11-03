
let pts = [
  { index: 0, name: "wrist", x: 0, y: 0, z: 0 },
  { index: 1, name: "thumb_cmc", x: 0, y: 0, z: 0 },
  { index: 2, name: "thumb_mcp", x: 0, y: 0, z: 0 },
  { index: 3, name: "thumb_ip", x: 0, y: 0, z: 0 },
  { index: 4, name: "thumb_tip", x: 0, y: 0, z: 0 },
  { index: 5, name: "index_finger_cmc", x: 0, y: 0, z: 0 },
  { index: 6, name: "index_finger_mcp", x: 0, y: 0, z: 0 },
  { index: 7, name: "index_finger_ip", x: 0, y: 0, z: 0 },
  { index: 8, name: "index_finger_tip", x: 0, y: 0, z: 0 },
  { index: 9, name: "middle_finger_cmc", x: 0, y: 0, z: 0 },
  { index: 10, name: "middle_finger_mcp", x: 0, y: 0, z: 0 },
  { index: 11, name: "middle_finger_ip", x: 0, y: 0, z: 0 },
  { index: 12, name: "middle_finger_tip", x: 0, y: 0, z: 0 },
  { index: 13, name: "ring_finger_cmc", x: 0, y: 0, z: 0 },
  { index: 14, name: "ring_finger_mcp", x: 0, y: 0, z: 0 },
  { index: 15, name: "ring_finger_ip", x: 0, y: 0, z: 0 },
  { index: 16, name: "ring_finger_tip", x: 0, y: 0, z: 0 },
  { index: 17, name: "pinky_cmc", x: 0, y: 0, z: 0 },
  { index: 18, name: "pinky_mcp", x: 0, y: 0, z: 0 },
  { index: 19, name: "pinky_ip", x: 0, y: 0, z: 0 },
  { index: 20, name: "pinky_tip", x: 0, y: 0, z: 0 },

]

let pastPositions = []
let hasWaved = false
let wasPinching = false
let deltaTime = 0

const videoElement = document.getElementsByClassName("input_video")[0]
// invert the videoElement
videoElement.style.transform = "scaleX(-1)"
const radius = 2  
const angle = Math.PI / 4

const scene = new THREE.Scene()
const camera3j = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.1,1e3)
camera3j.position.x = radius * Math.cos(angle)
camera3j.position.z = radius * Math.sin(angle)
renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
renderer.domElement.className = "output_canvas"
// add a grid helper
const gridHelper = new THREE.GridHelper(10, 10)
gridHelper.scale.set(.2,.2,.2)
scene.add(gridHelper)


let points = null
let drawnPts = []

let obj = new THREE.Object3D()

let lineGeometry = new THREE.SphereGeometry(0.01, 8, 4)
let c = new THREE.MeshNormalMaterial()
for (i = 0; i < 21; i++) {
  let a = new THREE.Mesh(lineGeometry, c)
  a.rotation.x = Math.PI
  obj.add(a)
}

for (i = 0; i < 21; i++) {
  let a = new THREE.Mesh(lineGeometry, c)
  a.rotation.x = Math.PI
  obj.add(a)
}

scene.add(obj)
lineGeometry = new THREE.Geometry()
line1 = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 10783210 })) 
// let rank = [0, 1, 2, 3, 4, 3, 2, 5, 6, 7, 8, 7, 6, 5, 9, 10, 11, 12, 11, 10, 9, 13, 14, 15, 16, 15, 14, 13, 17, 18, 19, 20, 19, 18, 17, 0, 21, 22, 23, 24, 25, 24, 23, 26, 27, 28, 29, 28, 27, 26, 30, 31, 32, 33, 32, 31, 30, 34, 35, 36, 37, 36, 35, 34, 38, 39, 40, 41, 40, 39, 38, 21];
// for (i = 0; i < rank.length; i++) lineGeometry.vertices.push(obj.children[rank[i]].position)
scene.add(line1)


function isPinching(hand) {
  if(!hand) return false
  const minPinchDistance = 0.05
  const thumb = hand[4]
  const index = hand[8]
  const distance = Math.sqrt((thumb.x - index.x) ** 2 + (thumb.y - index.y) ** 2 + (thumb.z - index.z) ** 2)
  const pinching = distance < minPinchDistance
  return pinching
}

function isWaving(hand) {
  if(!hand) return false
  let total = 0
  const tipsXDiffs = pastPositions.map((pos, i) => {
    total += hand[8].x - pos[8].x
    return (hand[8].x - pos[8].x)
  })

  // waving is when the hand is moving left and right, X times in a row
  const waves = tipsXDiffs.filter((diff) => {
    // when this diff and the previous diff are different signs
    if ( Math.sign(diff) !== Math.sign(tipsXDiffs[i - 1])) return true
    return 
  }
  ).length

  const waving = waves > 80
  
  // console.log('waves', waves, total, pastPositions.length, deltaTime, 1000./deltaTime) 
  return waving
}

// control function
let frames = 0
let lastTime = 0

function onResults(d) {
  deltaTime = Date.now() - lastTime // in ms, to get frames per second divide 1000 by deltaTime
  lastTime = Date.now()
  frames += 1
  const zoffset = 0.
  if (d.multiHandLandmarks.length > 0) {

    // pastPositions is to keep a history of the hand's position, so we can detect waving
    if (pastPositions.length < 160) {
      pastPositions.push(d.multiHandLandmarks[0])
    } else {
      // keep a rolling history
      pastPositions.shift()
      pastPositions.push(d.multiHandLandmarks[0])
    }
    if (hasWaved) {
      console.log("Waving")
    } else {
      if(isWaving(d.multiHandLandmarks[0])) hasWaved = true
    }

    for (let e = 0; e < 21; e++) {


       
      obj.children[e].position.x = -d.multiHandLandmarks[0][e].x;
      obj.children[e].position.y = -d.multiHandLandmarks[0][e].y;
      obj.children[e].position.z = zoffset + d.multiHandLandmarks[0][e].z;
      
      if (d.multiHandLandmarks.length > 1) {
        obj.children[e + 21].position.x = -d.multiHandLandmarks[1][e].x;
        obj.children[e + 21].position.y = -d.multiHandLandmarks[1][e].y;
        obj.children[e + 21].position.z = zoffset + d.multiHandLandmarks[0][e].z; // Note: This should likely be d.multiHandLandmarks[1][e].z for the second hand
      } else {
        obj.children[e + 21].position.x = -1000;
        obj.children[e + 21].position.y = -1000;
        obj.children[e + 21].position.z = -1000;
      }

     }
    }
    if (isPinching(d.multiHandLandmarks[0]) && frames % 2 === 0) {
        if(wasPinching !== true){
          drawnPts.push(d.multiHandLandmarks[0][8])
        }
        wasPinching = true
        const thumb = d.multiHandLandmarks[0][4]
        const index = d.multiHandLandmarks[0][8]
        const avg = {
          x: (thumb.x + index.x) / 2,
          y: (thumb.y + index.y) / 2,
          z: (thumb.z + index.z) / 2,
        }

        drawnPts.push(avg)
        if (drawnPts.length > 100) {
          drawnPts.shift()
        }
        lineGeometry = new THREE.Geometry()
        for (let i = 0; i < drawnPts.length; i++) {
          lineGeometry.vertices.push(new THREE.Vector3(-drawnPts[i].x, -drawnPts[i].y, drawnPts[i].z))
        }
        line1.geometry = lineGeometry

        
    }
  }
  

const hands = new Hands({locateFile: (b) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${b}`})

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
})
hands.onResults(onResults)
const camera = new Camera(videoElement, {
  async onFrame() {
    await hands.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
});

function animate() {
  camera3j.lookAt(0, 0, 0)
  lineGeometry.verticesNeedUpdate = true
  requestAnimationFrame(animate)
  renderer.render(scene, camera3j)
}
camera.start(),
camera3j.position.x = 0
camera3j.position.y = 1
camera3j.position.z = 1
camera3j.lookAt(0, 0, 0)
animate();