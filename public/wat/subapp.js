var mongo = require('mongodb').MongoClient;
var allPlayers = {};

module.exports = function(io){

  var watio = io.of('/wat')

  watio.on('connection', function( socket ){
     console.log('a user connected, not logged in'); 
     
      socket.on('try to login', function( maybe ){
       console.log(maybe.name, "tried to login with", maybe.password);
       mongo.connect('mongodb://localhost:27017/mydb', function(err, db){
       if(err) console.log("err", err);
       else{
         var coll = db.collection('users');
         coll.find( { name:maybe.name } ).toArray( function(err, doc){
             if (err) console.log("err", err);
             else {
                 console.log('found', doc.length, 'users with name', maybe.name );
                 if (doc.length > 0){
                     if ( maybe.password === doc[0].password ){
                         console.log('password checked out, logging in');
                         db.close();
                         socket.emit('successful login', allPlayers, doc[0] );
                          allPlayers[maybe.name] = doc[0];
                          socket.name = maybe.name;
                          console.log("nice to meet you, ", socket.name );
                          socket.broadcast.emit('new player', doc[0] );  //socket.broadcast better than io.emit
                     } else {
                         console.log('not a valid password');
                         db.close();
                         socket.emit('not a valid password');
                     }
                     
                 } else {
                      console.log('that name had not been used, making new user');
                      var newguy = { 
                          name: maybe.name, 
                          password: maybe.password ,
                          position:{x:0,y:2000,z:0},
                          rotation:{x:0,y:0,z:0},
                          color:"0xffffff",
                      }
                      coll.insert( newguy, function(err){if(err) console.log(err)} );
                      db.close();
                      allPlayers[maybe.name] = doc[0];
                      socket.name = maybe.name;
                      console.log("nice to meet you, ", socket.name );
                      socket.broadcast.emit('new player', newguy );  //socket.broadcast better than io.emit
                      socket.emit( 'successful login', allPlayers, newguy );
                     //make a new user with give name and password
                 }
             }
         });
       }
       });
     });
     
     //socket.emit('tell me about yourself', allPlayers);
     
     socket.on('disconnect', function( client ){
         console.log("disconnection");
      if (socket.hasOwnProperty('playerData')){
          console.log('user disconnected', socket.playerData.name);
          delete allPlayers[socket.name];
          //update for persistent position
          mongo.connect('mongodb://localhost:27017/mydb', function(err, db){
           if(err) console.log(err);
           else{
             var coll = db.collection('users');
              coll.update({
                  name: socket.playerData.name},
                      { $set: {
                          position: socket.playerData.position,
                          rotation: socket.playerData.rotation,
                          color: socket.playerData.color
                          }
                  });
           }
              db.close();
          });
           
           
          socket.broadcast.emit('kill player', socket.name );
      }
     });
     
     socket.on('look at me', function( client ){
       allPlayers[client.name] = client;
       socket.playerData = client;
       watio.emit('a player changed', client );
     });
     
     //db stuff
     socket.on('gimme all the images', function(){
       mongo.connect('mongodb://localhost:27017/mydb', function(err, db){
       if(err) console.log(err);
       else{
         var coll = db.collection('images');
         coll.find().toArray( function(err, doc){
           if (err) console.log(err);
           else{
              //console.log(doc);
              socket.emit('here are all the images', doc);   
              db.close();
           }
         });
       }
      });
       
     });
     
     socket.on('a new image', function( image ){
      mongo.connect('mongodb://localhost:27017/mydb', function(err,db){
        if(err)console.log(err);
        else{
          var coll = db.collection('images');
          coll.insert( image );
          watio.emit('a new image', image );
          db.close();
        }
      });  
     });
     
     socket.on('gimme all the posts', function(){
       mongo.connect('mongodb://localhost:27017/mydb', function(err, db){
       if(err) console.log(err);
       else{
         var coll = db.collection('messages');
         coll.find().toArray( function(err, doc){
           if (err) console.log(err);
           else{
              //console.log(doc);
              socket.emit('here are all the posts', doc);   
              db.close();
           }
         });
       }
      });
     });
     
      socket.on('a new yell', function( msg ){
          watio.emit('a new yell', msg );
      });
        
     
      socket.on('a new post', function( msg ){
          mongo.connect('mongodb://localhost:27017/mydb', function(err,db){
            if(err)console.log(err);
            else{
              var coll = db.collection('messages');
              coll.insert( msg );
              watio.emit('a new post', msg );
              db.close();
            }
          });  
          
      });
     
  });
}