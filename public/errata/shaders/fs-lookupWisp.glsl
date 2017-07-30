uniform float time;
varying float pulseSize;

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main(){
	float d = length(gl_PointCoord.xy - vec2(.5, .5));
	float r = 1.2 - 2.1*d;
  float c = r*r;
  gl_FragColor = vec4(hsv2rgb(vec3(-10.*(pulseSize)+.3, 1., 1.)), 1.);

//  gl_FragColor = vec4( 1. );

}
