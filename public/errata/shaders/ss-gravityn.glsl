uniform sampler2D t_oPos;
uniform sampler2D t_pos;

uniform vec2  resolution;

uniform float dT;
uniform float time;
uniform vec3 centerPos;
uniform float attraction;
uniform float cohesion;
uniform float minDistance;
uniform float linDrag;
uniform float speedLim;

void main(){

  float dsq;
  float f;
  float r;
  float dst;
  float cod;

  vec2 uv = gl_FragCoord.xy / resolution;
  vec4 oPos = texture2D( t_oPos , uv );
  vec4 pos  = texture2D( t_pos , uv );
  vec3 p = 2.*pos.xyz - oPos.xyz;
  // vec3 vel = pos.xyz - oPos.xyz;
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

      vec3 dir = pos.xyz - posb.xyz;
      dst= max(length(dir), minDistance);

      dsq = dst*dst;
      f = .0001*attraction/dsq - minDstPwr*.001*cohesion/(dsq*dsq);
      //r = .05/(dsq*dst);

      accel -= f * dir;
      // accel += r * dT * dir;
    }
  }
  // vel = vel + accel;
  // vel = vel *linDrag;
  // float v = length(vel);
  // if (v > speedLim) {
  //   vel = normalize(vel)*speedLim;
  // }

  p = p.xyz + 100.*dT * dT * accel*linDrag;
  gl_FragColor = vec4( p , 10.0*length(accel)/attraction );

}
