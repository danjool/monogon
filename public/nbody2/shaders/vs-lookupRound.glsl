uniform sampler2D t_pos;
uniform sampler2D t_col;
varying vec3 col;

void main(){

  
  vec4 pos = texture2D( t_pos , position.xy );
  vec4 col4 = texture2D( t_col, position.xy );
  col = col4.rgb;

  vec3 dif = cameraPosition - pos.xyz;
  
  gl_PointSize = max(2., min( 15. ,  800. / length( dif )));
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos.xyz , .5 );


}
