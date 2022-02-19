var sun = new Image()
var moon = new Image()
var earth = new Image()
let ctx, canvas, width, height, pt, center
let backgroundHue = 0.0
let n = 5.0
const twoThirdsPI = 2. * Math.PI / 3.
const sinTwoThirdsPI = Math.sin( twoThirdsPI )

let beige = 'rgba(245,245,220 , .02 )'

let ratio = 0.66

let iterations = 400

function randInt(from, to){ return Math.floor( Math.random()*( to - from )) + from }

function init() {
	canvas = document.getElementById('canvas')
	width = canvas.width; height = canvas.height
  ctx = canvas.getContext('2d')

	pt = { x: Math.random()*900, y: Math.random()*900 }
	center = { x: width/2.0, y: height/2.0 }

  ctx.fillStyle = beige //'rgba(255, 255, 255, 0.1)'
  ctx.fillRect(0,0,width,height)

  window.requestAnimationFrame(draw)
}

function drawTriangle( loc, size, rot ){
  let region = new Path2D();
  // ctx.beginPath();

  region.moveTo( loc.x + size * Math.cos( rot + 3. * twoThirdsPI ), loc.y + size * Math.sin( rot + 3. * twoThirdsPI ) );

  region.lineTo( loc.x + size * Math.cos( rot + twoThirdsPI ), loc.y + size * Math.sin( rot + twoThirdsPI ) )
  // region.stroke();

  region.lineTo( loc.x + size * Math.cos( rot + 2. * twoThirdsPI ), loc.y + size * Math.sin( rot + 2. * twoThirdsPI ) )
  // region.stroke();

  region.lineTo( loc.x + size * Math.cos( rot + 3. * twoThirdsPI ), loc.y + size * Math.sin( rot + 3. * twoThirdsPI ) )
  // region.stroke();

  ctx.closePath();
  ctx.fill(region, 'evenodd')
}

function drawFox(loc, size ){
  ctx.fillStyle = 'AliceBlue'
  drawTriangle( {x: loc.x, y: loc.y}, size, Math.PI/2. )
  ctx.fillStyle = 'gray'
  drawTriangle( {x: loc.x - size/2.*Math.cos(Math.PI/6.), y: loc.y - 3.*size/2.*Math.sin(Math.PI/6.)}, size/2., 3.*Math.PI/2. )
  drawTriangle( {x: loc.x + size/2.*Math.cos(Math.PI/6.), y: loc.y - 3.*size/2.*Math.sin(Math.PI/6.)}, size/2., 3.*Math.PI/2. )
}

let r = 0.0
let baseSize = 200.

function draw(){
  // r += .001
	// backgroundHue = ( backgroundHue + 0.7 ) % 360.0
	// ctx.fillStyle = 'hsla( ' + backgroundHue + ', 10%, 50%, 0.1 )'

	// ctx.globalCompositeOperation = 'destination-over'
  // ctx.fillStyle = 'blue' //'rgba(255, 255, 255, 0.1)'
  // ctx.fillRect(0,0,width,height)

  //center tri
  let j = 0.
  for (let i = 0; i < 6; i ++){
    for (let j = 0; j < 6; j++){

      let offsetX = baseSize * i * 6./4.*Math.sin( Math.PI/3.) 
      let offsetY = baseSize * j * 6./2.*Math.cos( Math.PI/3.) - baseSize * 3./2.*Math.cos( Math.PI/3.) * (i % 2.0) + baseSize * Math.cos( Math.PI/3.)

      ctx.strokeStyle = `rgb(
        0,
        ${Math.floor(255 - 42.5 * i)},
        ${Math.floor(255 - 42.5 * i)})
        `

      drawFox( { x: offsetX, y: offsetY}, 200.)
    }

  }

  // for (let i = 0; i < iterations; i ++){
  // 	let goalIndex = randInt( 0, corners.length )
  // 	let goal = corners[ goalIndex ]
  // 	ctx.strokeStyle = 'hsla( ' + goal.hueDegrees + ', 100%, 50%, 0.05)'
  // 	ctx.fillStyle = 'hsla( ' + goal.hueDegrees + ', 100%, 30%, 1.0)'

  // 	ctx.beginPath();
	 //  ctx.moveTo(pt.x, pt.y);

  // 	pt.x = pt.x + ( goal.x - pt.x ) * ratio
  // 	pt.y = pt.y + ( goal.y - pt.y ) * ratio

  // 	// if(goalIndex === 1){
		// ctx.lineTo( pt.x, pt.y );
	 //  ctx.stroke();	
  // 	// }
  	
		// ctx.beginPath()
	 //  	ctx.arc( pt.x, pt.y, 1, 2*Math.PI, 100)
	 //  	ctx.fill()
  // }

  window.requestAnimationFrame(draw)
}

init()