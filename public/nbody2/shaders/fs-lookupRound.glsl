uniform sampler2D t_pos;
uniform sampler2D t_col;
varying vec3 col;

void main(){  
	float r = 1.2 - 2.1*length(gl_PointCoord.xy - vec2(.5, .5));
  float c = r*r;

  gl_FragColor = vec4(col.xyz, c);

}
