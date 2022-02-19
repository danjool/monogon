var sun = new Image()
var moon = new Image()
var earth = new Image()
let ctx, canvas, width, height, pt, center
let backgroundHue = 0.0
let rot = 0.0
let n = 5.0
const twoThirdsPI = 2. * Math.PI / 3.
const pi = Math.PI
const sinTwoThirdsPI = Math.sin( twoThirdsPI )
const colors = ['pink' , 'darkblue' ]

let beige = 'rgba(245,245,220 , .02 )'

let ratio = 0.66

let iterations = 400

function randInt(from, to){ return Math.floor( Math.random()*( to - from )) + from }

function init() {
	canvas = document.getElementById('canvas')
	width = canvas.width; height = canvas.height
  ctx = canvas.getContext('2d')

	center = { x: width/2.0, y: height/2.0 }

  ctx.fillStyle = 'gray' //'rgba(255, 255, 255, 0.1)'
  ctx.fillRect(0,0,width,height)
  ctx.globalCompositeOperation = 'hard-light';

  window.requestAnimationFrame(draw)
}

function regularPolygon(ctx, x, y, radius, rotation, sides) {
  if (sides < 3) return;
  // console.log("regularPolygon", ctx)
  ctx.beginPath();
  var a = ((Math.PI * 2)/sides);
  ctx.translate(x,y);
  ctx.moveTo(radius*Math.cos(rotation),radius*Math.sin(rotation));
  for (var i = 1; i < sides; i++) {
    ctx.lineTo(radius*Math.cos(a*i + rotation),radius*Math.sin(a*i + rotation));
  }
  ctx.closePath();
  ctx.fill();
  // ctx.stroke();
  ctx.translate(-x,-y)
}

function drawTriangle( loc, size, rot ){
  let region = new Path2D();
  region.moveTo( loc.x + size * Math.cos( rot + 3. * twoThirdsPI ), loc.y + size * Math.sin( rot + 3. * twoThirdsPI ) );
  region.lineTo( loc.x + size * Math.cos( rot + twoThirdsPI ), loc.y + size * Math.sin( rot + twoThirdsPI ) )
  region.lineTo( loc.x + size * Math.cos( rot + 2. * twoThirdsPI ), loc.y + size * Math.sin( rot + 2. * twoThirdsPI ) )
  region.lineTo( loc.x + size * Math.cos( rot + 3. * twoThirdsPI ), loc.y + size * Math.sin( rot + 3. * twoThirdsPI ) )
  ctx.fill(region, 'evenodd')
  console.log(region)
}

function drawFox(loc, size ){
  ctx.fillStyle = 'pink'
  ctx.strokeStyle = 'red'
  // drawTriangle( {x: loc.x, y: loc.y}, size, Math.PI/2. )
  regularPolygon(ctx, loc.x, loc.y, size, Math.PI/2, 3)

  // regularPolygon(ctx, 400, loc.y, size, Math.PI/2, 3)
  ctx.fillStyle = 'darkcyan'
  ctx.strokeStyle = 'lightgray'
  regularPolygon(ctx, loc.x- size/2.*Math.cos(Math.PI/6.), loc.y- 3.*size/2.*Math.sin(Math.PI/6.), 
    size/2., 3.*Math.PI/2, 3)
  // drawTriangle( {x: loc.x - size/2.*Math.cos(Math.PI/6.), y: loc.y - 3.*size/2.*Math.sin(Math.PI/6.)}, size/2., 3.*Math.PI/2. )
  regularPolygon(ctx, loc.x+ size/2.*Math.cos(Math.PI/6.), loc.y- 3.*size/2.*Math.sin(Math.PI/6.), 
    size/2., 3.*Math.PI/2, 3)
  // drawTriangle( {x: loc.x + size/2.*Math.cos(Math.PI/6.), y: loc.y - 3.*size/2.*Math.sin(Math.PI/6.)}, size/2., 3.*Math.PI/2. )
}

function drawRandomPoly(i,j){
  let x = Math.random()*width 
  let y = Math.random()*height
  let size = Math.random()*200.+ 10.
  let rot = Math.random()*Math.PI*2.0
  let sides = Math.floor(Math.random()*14) + 2
  ctx.fillStyle = colors[(i+j)%colors.length]
  regularPolygon( ctx, x, y, size, rot, sides )
}

let r = 0.0
let baseSize = 100.

function draw(){

  ctx.fillStyle = 'gray' //'rgba(255, 255, 255, 0.1)'
  ctx.fillRect(0,0,width,height)

  // ctx.fillRect(50, 50, 100, 100);
  let maxi = Math.ceil(width / baseSize)
  let maxj = Math.ceil(height / baseSize)
  rot += 0.005


  let j = 0.
  for (let i = 0; i < maxi; i ++){
    for (let j = 0; j < maxj; j++){

      ctx.fillStyle = colors[(i+j)%colors.length];

      let offsetX = baseSize * i * 6./4.*Math.sin( Math.PI/3.) 
      let offsetY = baseSize * j * 6./2.*Math.cos( Math.PI/3.) - baseSize * 3./2.*Math.cos( Math.PI/3.) * (i % 2.0) + baseSize * Math.cos( Math.PI/3.)

      // ctx.strokeStyle = `rgb(
      //   0,
      //   ${Math.floor(255 - 42.5 * i)},
      //   ${Math.floor(255 - 42.5 * i)})
      //   `

      // drawFox( { x: offsetX, y: offsetY}, baseSize)
      // drawRandomPoly(i,j)
      regularPolygon(ctx, offsetX, offsetY, 
        baseSize, rot, 3)
    }
  }

  window.requestAnimationFrame(draw)
}

init()