var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var directory = require('serve-index');

var serverState = {};

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
})


app.use(directory(path.resolve(__dirname, 'public')));
app.use(express.static(path.resolve(__dirname, 'public')));

io.on('connection', function(socket){
   console.log('a user connected, sending serverState'); 
   
   socket.emit('take note', serverState);
   
   socket.on('disconnect', function(){
       //io.emit('chat message', "user disconnected");
       console.log('user disconnected');
   });
   
   socket.on('take note', function( clientState ){
       console.log('take note, from client');
       serverState = clientState;
       //console.log(serverState);
       io.emit('take note', serverState );
   });
   
});

http.listen(process.env.PORT, function(){
    console.log('listening on *:'+process.env.PORT);
});

//https://cards-danjool.c9users.io/?