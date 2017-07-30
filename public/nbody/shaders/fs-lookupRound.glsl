void main(){

	float r = 1.2 - 2.1*length(gl_PointCoord.xy - vec2(.5, .5));
  float c = r*r;
  gl_FragColor = vec4(r,r,r, r);

//  gl_FragColor = vec4( 1. );

}
