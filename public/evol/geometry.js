var sun = new Image()
var moon = new Image()
var earth = new Image()
let ctx
let theta = 0



function init() {
  sun.src = 'https://mdn.mozillademos.org/files/1456/Canvas_sun.png'
  moon.src = 'https://mdn.mozillademos.org/files/1443/Canvas_moon.png'
  earth.src = 'https://mdn.mozillademos.org/files/1429/Canvas_earth.png'
  ctx = document.getElementById('canvas').getContext('2d')
  window.requestAnimationFrame(draw)
}

function draw(){

	// ctx.globalCompositeOperation = 'destination-over'
  ctx.clearRect(0, 0, 300, 300) // clear canvas

	ctx.drawImage(sun, 0, 0, 300, 300);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.strokeStyle = 'rgba(0, 153, 255, 0.4)'
  ctx.save()
	  ctx.translate(150, 150)

	  // Earth
	  var time = new Date()
	  ctx.rotate( ((2 * Math.PI) / 60) * time.getSeconds() + ((2 * Math.PI) / 60000) * time.getMilliseconds() )
	  ctx.translate(105, 0)

	  ctx.drawImage(earth, -12, -12)

		  // Moon
		  ctx.save();
		  let r = ((2 * Math.PI) / 6) * time.getSeconds() + ((2 * Math.PI) / 6000) * time.getMilliseconds()
		  ctx.rotate(r);
		  ctx.translate(0, 28.5);

		  ctx.save()
		  	ctx.rotate(-r)
		  	ctx.fillRect(0, -6, 40, 12) // Moon Shadow
	  	ctx.restore()

		  ctx.drawImage(moon, -3.5, -3.5);
	  ctx.restore();

	  ctx.fillRect(0, -12, 40, 24) // Earth Shadow

  ctx.restore();

  ctx.beginPath();
  ctx.arc(150, 150, 105, 0, Math.PI * 2, false); // Earth orbit
  ctx.stroke();

  window.requestAnimationFrame(draw)
}



init()