var sun = new Image()
var moon = new Image()
var earth = new Image()
let ctx, canvas, width, height, pt, center
let backgroundHue = 0.0
let n = 5.0

let beige = 'rgba(245,245,220 , .02 )'

let corners = [
	// {x: 20, y: 800}, 
	// {x: 800, y: 800}, 
	// {x: 800, y: 20}, 
	// {x: 20, y: 20}, 
]
let ratio = 0.66

let iterations = 400

function randInt(from, to){ return Math.floor( Math.random()*( to - from )) + from }

function init() {
	canvas = document.getElementById('canvas')
	width = canvas.width; height = canvas.height
	pt = { x: Math.random()*900, y: Math.random()*900 }
	center = { x: width/2.0, y: height/2.0 }
  ctx = canvas.getContext('2d')
  
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

  for ( let c in corners ){
  	let corner = corners[c]
  	ctx.fillStyle = 'rgba(0, 0, 100, 1.0)'
  	ctx.beginPath()
  	ctx.arc( corner.x, corner.y, 1, 2 * Math.PI, 100)
  	ctx.fill()
  }

  window.requestAnimationFrame(draw)

}

function draw(){
	// backgroundHue = ( backgroundHue + 0.7 ) % 360.0
	// ctx.fillStyle = 'hsla( ' + backgroundHue + ', 10%, 50%, 0.1 )'

	// ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = beige //'rgba(255, 255, 255, 0.1)'


  ctx.fillRect(0,0,width,height)

  for (let i = 0; i < iterations; i ++){
  	let goalIndex = randInt( 0, corners.length )
  	let goal = corners[ goalIndex ]
  	ctx.strokeStyle = 'hsla( ' + goal.hueDegrees + ', 100%, 50%, 0.05)'
  	ctx.fillStyle = 'hsla( ' + goal.hueDegrees + ', 100%, 30%, 1.0)'

  	ctx.beginPath();
	  ctx.moveTo(pt.x, pt.y);

  	pt.x = pt.x + ( goal.x - pt.x ) * ratio
  	pt.y = pt.y + ( goal.y - pt.y ) * ratio

  	// if(goalIndex === 1){
		ctx.lineTo( pt.x, pt.y );
	  ctx.stroke();	
  	// }
  	

		ctx.beginPath()
	  	ctx.arc( pt.x, pt.y, 1, 2*Math.PI, 100)
	  	ctx.fill()
	  }

  window.requestAnimationFrame(draw)
}

init()