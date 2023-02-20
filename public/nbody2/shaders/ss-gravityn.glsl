uniform sampler2D t_oPos;
uniform sampler2D t_pos;
uniform sampler2D t_col;

uniform vec2  resolution;

uniform float dT;
uniform float time;
uniform vec3 centerPos;
uniform float attraction;
uniform float cohesion;
uniform float minDistance;
uniform float linDrag;
uniform float speedLim;

uniform float redgreen;
uniform float redred;
uniform float redwhite;
uniform float redblue;
uniform float greengreen;
uniform float greenred;
uniform float greenwhite;
uniform float greenblue;
uniform float bluegreen;
uniform float bluered;
uniform float bluewhite;
uniform float blueblue;
uniform float whitegreen;
uniform float whitered;
uniform float whitewhite;
uniform float whiteblue;

void main(){

  float dsq;
  float f;
  float r;
  float dst;
  float cod;

  vec2 uv = gl_FragCoord.xy / resolution;
  vec4 oPos = texture2D( t_oPos , uv );
  vec4 pos  = texture2D( t_pos , uv );
  vec4 cola  = texture2D( t_col , uv );
  vec3 p = 2.*pos.xyz - oPos.xyz;
  vec3 vel = pos.xyz - oPos.xyz;
  vec3 accel = vec3(0., 0., 0.);

  //spin around y axis, only near beginning
  // vec3 radialPush = dT*normalize(cross(vec3( pos.x, pos.y, pos.z ), vec3(0., 1., 0.)));
  // vel += .005*radialPush*(min(1., 1./time));

  //random radial
  // vec3 randPush = vec3( sin(pos.x), sin(pos.y), sin(pos.z));
  // vel+= .01*randPush*(min(1., 1./time));

  //squish flat over time
  // vel.y *= .9999;
  float minDstPwr = pow(minDistance, 2.);

  for (int  y=0; y < SIZE; y++) {
    for (int x=0; x < SIZE; x++) {
      // if (gl_FragCoord.x == float(x) && gl_FragCoord.y == float(y)) continue;
      vec2 uvb = vec2( (float(x)+0.0)/resolution.x, (float(y)+.0)/resolution.y );
      vec4 posb = texture2D( t_pos, uvb );
      vec4 colb = texture2D( t_col, uvb );

      vec3 dir = pos.xyz - posb.xyz;
      dst= max(length(dir), minDistance);
      //dsq = dst*dst;
      
      float redb = colb.x*(1.-colb.y)*(1.-colb.z);
      float greenb = colb.y*(1.-colb.x)*(1.-colb.z);
      float blueb = colb.z*(1.-colb.y)*(1.-colb.x);
      float whiteb = colb.x*colb.y*colb.z;
      
      
      float reda = cola.x*(1.-cola.y)*(1.-cola.z);
      float greena = cola.y*(1.-cola.x)*(1.-cola.z);
      float bluea = cola.z*(1.-cola.y)*(1.-cola.x);
      float whitea = cola.x*cola.y*cola.z;

      float ruleFactor = 
      redred*     reda*redb + 
      redgreen*   reda*greenb + 
      redblue*    reda*blueb +
      redwhite*   reda*whiteb +
      greenred*   greena*redb + 
      greengreen* greena*greenb + 
      greenblue*  greena*blueb + 
      greenwhite* greena*whiteb +
      bluered*    bluea*redb + 
      bluegreen*  bluea*greenb + 
      blueblue*   bluea*blueb + 
      bluewhite*  bluea*whiteb +
      whitered*   whitea*redb + 
      whitegreen* whitea*greenb + 
      whiteblue*  whitea*blueb + 
      whitewhite* whitea * whiteb
      ;

      f = ruleFactor*.01*cohesion*attraction/dst;// - minDstPwr*.0001*cohesion/(dsq*dsq);
      //r = .05/(dsq*dst);

      accel -= f * (dir);
      // accel += r * dT * dir;
    }
  }

  vel = dT * dT * accel;
  vel = vel *linDrag;
  vel.y -= .0005*cola.b;
  vel.y += .000005*(300. - length(vec2(p.x, p.y)));
  float v = length(vel);
  if (v > speedLim) {
    vel = normalize(vel)*speedLim;
  }
  p = p.xyz + vel;
  // p = min(length(p), 400.0)*normalize(p);
  // vec3 newPos = pos.xyz + v*normalize(vel);
  gl_FragColor = vec4( p , length(accel)/attraction ); //p

}
