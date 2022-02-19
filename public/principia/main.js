let ctx, canvas
let showPointLabels = true, showGrid = true, viewLineAngleAsHue = true, showTriangleLabels = true, showCircleLabels = false,
  dirty = true

let highlightables = {}
let mouse = { x: 0, y: 0, drag: false }
let points = {
  K:{ x: 100, y: 200, r: 10, drag: false, offsetx: 0, offsety: 0, highlighted: false, hue: 180 },
  O:{ x: 300, y: 200, r: 10, drag: false, offsetx: 0, offsety: 0, highlighted: false, hue: 180 },
  L:{ x: 525, y: 200, r: 10, drag: false, offsetx: 0, offsety: 0, highlighted: false, hue: 180 },

  A:{ x: 100, y: 600, r: 10, drag: false, offsetx: 0, offsety: 0, highlighted: false, hue: 180 },
  C:{ x: 210, y: 530, r: 10, drag: false, offsetx: 0, offsety: 0, highlighted: false, hue: 180 },
  D:{ x: 100, y: 300, r: 10, drag: false, offsetx: 0, offsety: 0, highlighted: false, hue: 180 },

  M:{ x: 100, y: 100, r: 10, drag: false, offsetx: 0, offsety: 0, highlighted: false, hue: 180 },
  N:{ x: 525, y: 150, r: 10, drag: false, offsetx: 0, offsety: 0, highlighted: false, hue: 180 },
  P:{ x: 525, y: 480, r: 10, drag: false, offsetx: 0, offsety: 0, highlighted: false, hue: 180 },

  p:{ x: 475, y: 475, r: 10, drag: false, offsetx: 0, offsety: 0, highlighted: false, hue: 180 },
  H:{ x: 475, y: 70,  r: 10, drag: false, offsetx: 0, offsety: 0, highlighted: false, hue: 180 },

}
for(let i in points){ points[i].label = i }

let lines = {
  AD: { a: 'A', b: 'D', hue: 60,  highlighted: false, width: 1 },
  AC: { a: 'A', b: 'C', hue: 120, highlighted: false, width: 1 },
  CD: { a: 'C', b: 'D', hue: 120, highlighted: false, width: 1 },
  DK: { a: 'D', b: 'K', hue: 120, highlighted: false, width: 1 },
  OD: { a: 'O', b: 'D', hue: 20,  highlighted: false, width: 1 },

  OM: { a: 'O', b: 'M', hue: 120, highlighted: false, width: 1 },
  ON: { a: 'O', b: 'N', hue: 120, highlighted: false, width: 1 },

  OK: { a: 'O', b: 'K', hue: 160, highlighted: false, width: 1 },
  OL: { a: 'O', b: 'L', hue: 160, highlighted: false, width: 1 },
  MK: { a: 'M', b: 'K', hue: 120, highlighted: false, width: 1 },
  MA: { a: 'M', b: 'A', hue: 120, highlighted: false, width: 1 },

  KL: { a: 'K', b: 'L', hue: 160, highlighted: false, width: 1 },
  LP: { a: 'L', b: 'P', hue: 120, highlighted: false, width: 1 },
  NL: { a: 'N', b: 'L', hue: 120, highlighted: false, width: 1 },
  Hp: { a: 'H', b: 'p', hue: 80,  highlighted: false, width: 1 },
  Np: { a: 'N', b: 'p', hue: 80,  highlighted: false, width: 1 },
  HN: { a: 'H', b: 'N', hue: 80,  highlighted: false, width: 1 },
}
//reverseLabel here to scan for lines indicated by reverse ordering of points?  
for(let i in lines){ lines[i].label = i; lines[i].reverseLabel = i.split('').reverse().join('') } //give an easy access to the key labeling this line

let triangles = {
  ADC : { a: 'A', b: 'D', c: 'C', hue: 20, highlighted: false},
  DOK : { a: 'D', b: 'O', c: 'K', hue: 80, highlighted: false},
}

// a plane is just like a line (segment) except the points aren't visible
let planes = {
  pG : { a: {x: 507, y: 457}, b: {x: 457, y: 507}, hue: 270,  highlighted: false, width: 1 },
  pQ : { a: {x: 457-32, y: 457-18}, b: {x: 507-32, y: 507-18}, hue: 270,  highlighted: false, width: 1 },
}

let circles = {
  circleOM : { center: 'O', anchor: 'M', hue: 120, highlighted: false }
}

// run through all the lines and make the hues correspond to the angle of the lines
function forceLineHues(){
  for(let i in lines){ 
    let l = lines[i]
    let x1 = points[l.a].x, y1 = points[l.a].y
    let x2 = points[l.b].x, y2 = points[l.b].y
    let flipSign = (y2-y1) < 0 ? -1 : 1

    let theta = ( ( Math.atan2( flipSign*(y2-y1), flipSign*(x2-x1) )*360.0/(Math.PI) ) + 360)%360
    // console.log(l.a, l.b, theta, x1, y1, x2, y2)
    l.hue = theta
  }
}
if( viewLineAngleAsHue ){ forceLineHues() }

function init() {
  visuals = document.getElementById('visuals')
  canvas = document.getElementById('canvas')
  canvas.width = visuals.offsetWidth
  canvas.style.width = visuals.offsetWidth + 'px'

  canvas.height = Math.min(visuals.offsetHeight, window.innerHeight)
  canvas.style.height = Math.min(visuals.offsetHeight, window.innerHeight) + 'px'
  ctx = canvas.getContext('2d')
  // ctx.globalCompositeOperation = 'destination-over'
  window.requestAnimationFrame(draw)
  canvas.onmousedown = myDown;
  canvas.onmouseup = myUp;
  canvas.onmousemove = myMove;
  window.onscroll = function() { dirty = true }
}

function drawPoint( point ){
  ctx.fillStyle   = 'hsla( ' + point.hue + ', 100%, 50%, 1.0)'
  ctx.beginPath()
  let r = point.highlighted ? point.r*2.0 : point.r
  ctx.arc( point.x, point.y, r, 2 * Math.PI, 100)
  ctx.fill()    
  if(showPointLabels && point.label){
    ctx.font = '16px serif';
    ctx.fillStyle   = 'hsla( ' + (point.hue+180)%360 + ', 100%, 50%, 1.0)'
    ctx.fillText(point.label, point.x - point.r/2, point.y+point.r/2);  
  }
}

function drawCircle( circle ){
  ctx.fillStyle   = 'hsla( ' + circle.hue + ', 100%, 50%, 0.2)'
  ctx.strokeStyle   = 'hsla( ' + circle.hue + ', 100%, 50%, 0.4)'
  ctx.beginPath()
  let center = points[circle.center]
  let anchor = points[circle.anchor]
  let r = distance( center, anchor )
  ctx.arc( center.x, center.y, r, 2 * Math.PI, 100)
  ctx.stroke()
  ctx.fill()    
  // if(showCircleLabels && circle.label){
  //   ctx.font = '16px serif';
  //   ctx.fillStyle   = 'hsla( ' + (circle.hue+180)%360 + ', 100%, 50%, 1.0)'
  //   ctx.fillText(circle.label, circle.x - circle.r/2, circle.y+circle.r/2);  
  // }
}

function drawTriangle( triangle ){
  ctx.fillStyle = triangle.highlighted ? 'hsla( ' + triangle.hue + ', 100%, 50%, 0.4)' : 'hsla( ' + triangle.hue + ', 100%, 50%, 0.1)'
  ctx.beginPath();
  ctx.moveTo( points[triangle.a].x, points[triangle.a].y );
  ctx.lineTo( points[triangle.b].x, points[triangle.b].y );
  ctx.lineTo( points[triangle.c].x, points[triangle.c].y );
  ctx.lineTo( points[triangle.a].x, points[triangle.a].y );
  // ctx.stroke(); 
  ctx.fill()    
  if(showTriangleLabels){
    drawPoint(centroid(triangle))
    // ctx.font = '16px serif';
    // ctx.fillStyle   = 'hsla( ' + (triangle.hue+180)%360 + ', 100%, 50%, 1.0)'
    // ctx.fillText(triangle.label, triangle.x - triangle.r/2, triangle.y+triangle.r/2);  
  } 
}

function drawLine( line ){
  ctx.strokeStyle = 'hsla( ' + line.hue + ', 100%, 50%, 1.0)'
  ctx.lineWidth = line.highlighted ? 5 : 1;
  ctx.beginPath();
  ctx.moveTo( points[line.a].x, points[line.a].y );
  ctx.lineTo( points[line.b].x, points[line.b].y );
  ctx.stroke(); 
}

function drawPlane( plane ){ // a line segment that is a 'plane' viewed from the side
  ctx.strokeStyle = 'hsla( ' + plane.hue + ', 100%, 50%, 1.0)'
  ctx.lineWidth = plane.highlighted ? 5 : 1;
  ctx.beginPath();
  ctx.moveTo( plane.a.x, plane.a.y );
  ctx.lineTo( plane.b.x, plane.b.y );
  ctx.stroke(); 
} 

function distance( a, b ){
  if( !a.hasOwnProperty('x') || !a.hasOwnProperty('y') || !b.hasOwnProperty('x') || !b.hasOwnProperty('y')){return null}
  return Math.sqrt( (b.x - a.x)*(b.x - a.x) + (b.y - a.y)*(b.y - a.y) )
}

function distancePointToLine( p, l ){
  let x1 = points[l.a].x, y1 = points[l.a].y
  let x2 = points[l.b].x, y2 = points[l.b].y
  let x0 = p.x, y0 = p.y
  // this is the mathy way to get a proper distance to the nearest point on the line segment
  // return Math.abs( (x2-x1)*(y1-y0) - (x1-x0)*(y2-y1) )*1.0 / Math.sqrt( (x2-x1)**2 + (y2-y1)**2 )
  // this is just the distance to the center of the line segment
  let center = { x: ( x1 + (x2-x1)/2.0 ), y: ( y1 + (y2-y1)/2.0 ) }
  return distance( p, center )
}

function distancePointToPlane( pt, pl ){
  let x1 = pl.a.x, y1 = pl.a.y
  let x2 = pl.b.x, y2 = pl.b.y
  let x0 = pt.x, y0 = pt.y
  let center = { x: ( x1 + (x2-x1)/2.0 ), y: ( y1 + (y2-y1)/2.0 ) }
  return distance( pt, center ) 
}

function centroid( t ){
  let x1 = points[t.a].x, y1 = points[t.a].y
  let x2 = points[t.b].x, y2 = points[t.b].y
  let x3 = points[t.c].x, y3 = points[t.c].y
  return {x: (x1+x2+x3)/3.0, y: (y1+y2+y3)/3.0, r: 5}
}

function draw(){
  if(!dirty){window.requestAnimationFrame(draw);return} // bail if nothing changed to not waste resources
  var time = new Date()
  ctx.clearRect(0, 0, canvas.width, canvas.height) // clear canvas
  // canvas.style.padding = window.scrollY + 'px 0px 0px 0px'
  ctx.lineWidth = .5;

  if(showGrid){
    for(let x = 0; x < canvas.width; x+= 10){
      ctx.strokeStyle = x%100 === 0 ? 'rgba(128, 256, 256, .3)' : 'rgba(128, 256, 256, .1)'
      ctx.beginPath();
      ctx.moveTo( x, 0 );
      ctx.lineTo( x, canvas.height );
      ctx.stroke(); 
    }
    for(let y = 0; y < canvas.height; y+= 10){
      ctx.strokeStyle = y%100 === 0 ? 'rgba(256, 128, 128, .5)' : 'rgba(256, 128, 128, .2)'
      ctx.beginPath();
      ctx.moveTo( 0, y );
      ctx.lineTo( canvas.width, y );
      ctx.stroke(); 
    }
  }

  ctx.fillStyle = 'rgba(0, 150, 0, 0.5)'
  ctx.strokeStyle = 'rgba(0, 153, 255, 0.4)'

  for(let label in lines){
    let line = lines[label]
    drawLine( line, 1)
  }

  for (let label in circles){
    let circle = circles[label]
    drawCircle(circle)
  }

  for(var label in points){
    let point = points[label]
    drawPoint( point )
  }

  for(var label in triangles){
    let triangle = triangles[label]
    drawTriangle( triangle )
  }

  for (let label in planes){
    let plane = planes[label]
    drawPlane(plane)
  }
  dirty = false;
  window.requestAnimationFrame(draw)
}

function myMove(e){
  mouse.x = e.pageX - canvas.offsetLeft;
  mouse.y = e.pageY - canvas.offsetTop - window.scrollY;

  // scan through all the points to see if any need to be highlighted at draw
  for(let label in points){
    // only have to 'move' the points, not lines, cause points drive lines
    let point = points[label]
    if(point.drag){
      point.x = mouse.x
      point.y = mouse.y
      dirty = true
    }
    let d = distance(mouse, point)
    if( d < point.r ){
      if(!point.highlighted){
        point.highlighted = true
        dirty = true
      }
      if(highlightables.hasOwnProperty(point.label)){ 
        for(let i = 0; i < highlightables[label].length; i++){
          highlightables[label][i].style.textShadow = "0px 0px 5px red"
        }
      }
    } else {
      if(point.highlighted){
        point.highlighted = false
        dirty = true
      }
      if( highlightables.hasOwnProperty( point.label ) ) {
        for( let i = 0; i < highlightables[ label ].length; i++) {
          highlightables[label][i].style.textShadow = ""
        }
      }
    }
  }

  // scan through all the lines to see if any need to be highlighted at draw
  for(let label in lines) {
    let line = lines[label]
    let d = distancePointToLine( mouse, line )

    if( d < 15 ){
      if(!line.highlighted){
        line.highlighted = true
        dirty = true
      }
      if(highlightables.hasOwnProperty(label)){
        for( let i = 0; i < highlightables[ label ].length; i++) {
          highlightables[label][i].style.textShadow = "0px 0px 5px red"
        }
      }
    } else {
      if(line.highlighted){
        line.highlighted = false
        dirty = true
      }
      if(highlightables.hasOwnProperty(label)){
        for( let i = 0; i < highlightables[ label ].length; i++) {
          highlightables[label][i].style.textShadow = "" 
        }
      }
    }
  }

  for(let label in triangles) {
    let triangle = triangles[label]
    let d = distance( centroid(triangle), mouse )
    // console.log("triangle d",d)

    if( d < 15 ){
      if(!triangle.highlighted){
        triangle.highlighted = true
        dirty = true
      }
      if(highlightables.hasOwnProperty(label)){
        for( let i = 0; i < highlightables[ label ].length; i++) {
          highlightables[label][i].style.textShadow = "0px 0px 5px red"
        }
      }
    } else {
      if(triangle.highlighted){
        triangle.highlighted = false
        dirty = true
      }
      if(highlightables.hasOwnProperty(label)){
        for( let i = 0; i < highlightables[ label ].length; i++) {
          highlightables[label][i].style.textShadow = "" 
        }
      }
    }
  }// end triangle loop

  for(let label in planes) {
    let plane = planes[label]
    let d = distancePointToPlane( mouse, plane )
    // console.log("plane d",d)

    if( d < 15 ){
      if(!plane.highlighted){
        plane.highlighted = true
        dirty = true
      }
      if(highlightables.hasOwnProperty(label)){
        for( let i = 0; i < highlightables[ label ].length; i++) {
          highlightables[label][i].style.textShadow = "0px 0px 5px red"
        }
      }
    } else {
      if(plane.highlighted){
        plane.highlighted = false
        dirty = true
      }
      if(highlightables.hasOwnProperty(label)){
        for( let i = 0; i < highlightables[ label ].length; i++) {
          highlightables[label][i].style.textShadow = "" 
        }
      }
    }
  }// end plane loop
  console.log("myMove", mouse, "dirty", dirty)

  if(viewLineAngleAsHue){ forceLineHues() }
}

function myDown(e){
  // console.log(e, mouse.x, mouse.y)
  mouse.x = e.pageX - canvas.offsetLeft;
  mouse.y = e.pageY - canvas.offsetTop;
  mouse.drag = true;

  for(let label in points){
    let point = points[label]
    let d = distance(mouse, point)
    if( d < point.r ){
      console.log("grabbed point", point.x, point.y)
      point.drag = true
      point.offsetx = point.x - mouse.x
      point.offsety = point.y - mouse.y
    }
  }
}

function myUp(){
 mouse.drag = false;
 for(let i in points){points[i].drag = false}
}

// setup the parallel highlighting of correlated 'elements'
// where for now the elements have to be web elements with style
// but we also want to highlight the points
function hoverByClass(classname,colorover,colorout="transparent"){
  // console.log("hoverByClass", classname)
  let reverseClassname = classname.split('').reverse().join('')
  let elms = [...document.getElementsByClassName(classname), ...document.getElementsByClassName(reverseClassname)]
  
  // console.log('hoverByClass', classname, reverseClassname, elms)
  highlightables[ classname ] = elms
  
  for(var i=0;i<elms.length;i++){
    elms[i].onmouseover = function(){
      dirty = true
      for(var k=0;k<elms.length;k++){
        elms[k].style.textShadow="0px 0px 5px red";
      }

      for(let i in points){
        let point = points[i]
        if (point.label === classname){
          point.highlighted = true
        }
      }
      for(let key in lines){
        let line = lines[key]
        if (key === classname || line.reverseLabel === classname){
          line.highlighted = true
        }
      }
      for(let key in triangles){
        let triangle = triangles[key]
        if (key === classname || triangle.reverseLabel === classname){
          triangle.highlighted = true
        }
      }

    };
    elms[i].onmouseout = function(){
      dirty = true
      for(var k=0;k<elms.length;k++){
        // elms[k].style.backgroundColor=colorout;
        elms[k].style.textShadow="";
      }

      for(let i in points){
        let point = points[i]
        if (point.label === classname){
            point.highlighted = false
        } 
      } 
      for(let key in lines){
        let line = lines[key]
        if (key === classname){
          line.highlighted = false
        }
      }
      for(let key in triangles){
        let triangle = triangles[key]
        if (key === classname || triangle.reverseLabel === classname){
          triangle.highlighted = false
        }
      }
    };

  } //for elms
}

for(let i in points){
  hoverByClass(i, "yellow")
}
for(let i in lines){
  hoverByClass(i, "yellow")
}
for(let i in triangles){
  hoverByClass(i, "yellow")
}

for(let i in planes){
  hoverByClass(i, "yellow")
}

init()