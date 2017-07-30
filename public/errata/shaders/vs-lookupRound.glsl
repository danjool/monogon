uniform sampler2D t_pos;
varying float pulseSize;

void main(){

  vec4 pos = texture2D( t_pos , position.xy );
  //pulseSize = position.x + position.y;
  pulseSize = pos.a;

  vec3 dif = cameraPosition - pos.xyz;
  
  gl_PointSize = max(2., min( 15. ,  800. / length( dif )));
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos.xyz , .5 );


}
