var express = require('express')
var app = express()
var server = require('http').createServer(app)
var directory = require('serve-index');
var path = require('path');
var socketio = require('socket.io')
var vhost = require('vhost')

var io = socketio.listen(server)

// https://stackoverflow.com/questions/15135358/whats-the-best-way-to-implement-socket-io-as-a-submodule-within-expressjs
// https://stackoverflow.com/questions/35620811/running-two-socket-servers-on-same-port
// also the two apps that require socket.io use different namespaces: https://socket.io/docs/rooms-and-namespaces/
var watio = require('./public/wat/subapp')(io)

var cardio= require('./public/cards/cards-subapp')(io)
app.use('/cards/images/rws', directory(path.resolve(__dirname, './public/cards/images/rws/')));

// app.use('/old', express.static(path.join(__dirname, 'old')))
app.use('/', express.static(path.join(__dirname, 'public')))

app.use(vhost('kowl', (req, res, next)=>{
	res.send('woot')
}))

server.listen(80)