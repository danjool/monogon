var sun = new Image()
var moon = new Image()
var earth = new Image()
let ctx, canvas, width, height, pt, center
let backgroundHue = 0.0
let n = 5.0
const phi = 1.618033988

let beige = 'rgba(245,245,220 , .002 )'
let white = 'rgba(255,255,255 , 0.1 )'

let corners = [
	// {x: 20, y: 800}, 
	// {x: 800, y: 800}, 
	// {x: 800, y: 20}, 
	// {x: 20, y: 20}, 
]
let ratio = 0.66

let iterations = 8000
const scale = 440.


function randInt(from, to){ return Math.floor( Math.random()*( to - from )) + from }

function init() {
	canvas = document.getElementById('canvas')
	width = canvas.width; height = canvas.height
  console.log(width,height)
	pt = { x: Math.random()*900, y: Math.random()*900 }
	center = { x: width/2.0, y: height/2.0 }
  ctx = canvas.getContext('2d')

  ctx.fillStyle = 'rgba(0, 255, 255, 0.01)'
  ctx.strokeStyle = 'hsla( ' + 0 + ', 100%, 50%, 1.0)'
  
	let r = Math.min(width, height)*.45
  for ( let j = 0; j < n; j++){
  	let theta = 2.0*Math.PI*j/n
  	corners.push( { 
  		x: center.x + r * Math.cos( theta ), 
  		y: center.y + r * Math.sin( theta ),
  		hueDegrees: 360.0 * j / n
  	} )
  }
  console.log(corners)

  // for ( let c in corners ){
  // 	let corner = corners[c]
  // 	ctx.fillStyle = 'rgba(0, 0, 100, 1.0)'
  // 	ctx.beginPath()
  // 	ctx.arc( corner.x, corner.y, 1, 2 * Math.PI, 100)
  // 	ctx.fill()
  // }

  window.requestAnimationFrame(draw)

}

function drawLine( x,y,x2,y2 ){
  ctx.beginPath();
  ctx.moveTo( x, y);
  ctx.lineTo( x2, y2 );
  ctx.stroke(); 
}

function drawCircle( x,y,r, ){
  ctx.beginPath()
  ctx.arc( x, y, r, 2*Math.PI, 100)
  ctx.fill()
}

function randomPeg(){
  let i = Math.round(iterations*Math.random())
  let x = scale*(i - 0.5)/iterations
  let y = scale*( (i/phi)%1 )
  return {x: scale*(i - 0.5)/iterations, y: scale*( (i/phi)%1) }
}

function randomColor(){
  let h = (Math.floor(Math.random()*8)/8.0)*360.
  console.log(h)
  ctx.strokeStyle = 'hsla( ' + h + ', 100%, 50%, 1.0)'
}
let j = 0

function draw(){
	// backgroundHue = ( backgroundHue + 0.7 ) % 360.0
	// ctx.fillStyle = 'hsla( ' + backgroundHue + ', 10%, 50%, 0.1 )'

	// ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = white //'rgba(200, 0, 0, 0.1)'

  ctx.fillRect(0,0,width,height)

  // ctx.strokeStyle = 'hsla( ' + 0 + ', 100%, 50%, 1.0)'
  let iterations = (j*2)
  

  for (let i = 0; i < iterations; i ++){
    // let y = scale*(i - 0.5)/iterations
    // let x = scale*( (i/phi)%1 )
    let r = scale*(i - 0.5)/iterations
    let theta = Math.PI*2.*( (i/phi)%1 )
    let s = Math.max(8*( i )/iterations, 0.5)
    let x = width/2. + r*Math.cos(theta)
    let y = height/2. + r*Math.sin(theta)
    ctx.fillStyle = 'hsla( ' + (i/iterations)*360 + ', 100%, 50%, '+ 0.5 +')'
    drawCircle( x, y, s ) //(height - y)/height

    // console.log(i,x,y)
  }

  // for (let i = 0; i < 1000; i++){
  //   randomColor()
  //   let pt1 = randomPeg()
  //   let pt2 = randomPeg()
  //   // console.log(pt1, pt2)
  //   drawLine( pt1.x, pt1.y, pt2.x, pt2.y )
  // }
  j += 10 // console.log(i)
  // window.requestAnimationFrame(draw)
}

init()