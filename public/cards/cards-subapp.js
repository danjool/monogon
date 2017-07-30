var path = require('path');
var serverState = {};

/*
This is the version of the "server" that depends on a primary server, app.js
The standalone version is cards-server.js, which includes the express stuff
*/

module.exports = function(io){
  
  cardsio = io.of('/cards')
  
  cardsio.on('connection', function(socket){
     console.log('a user connected to cardsio, sending serverState'); 
     
     socket.emit('take note', serverState);
     
     socket.on('disconnect', function(){
         console.log('user disconnected');
     });
     
     socket.on('take note', function( clientState ){
         console.log('take note, from client');
         serverState = clientState;
         cardsio.emit('take note', serverState );
     });
     
  });

}