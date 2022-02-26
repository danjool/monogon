var express = require('express')
var app = express()
var server = require('http').createServer(app)
var directory = require('serve-index');
var path = require('path');
// var socketio = require('socket.io')
// var vhost = require('vhost')
var router = express.Router()
// let sqlite3 = require('sqlite3').verbose()
const { Pool } = require('pg');

let pool
if( process.env.DATABASE_URL && process.env.DATABASE_URL !== undefined ){
	console.log('connecting to heroku postgres db with url', process.env.DATABASE_URL)
	pool = new Pool({
		connectionString: process.env.DATABASE_URL,

		ssl: {
			rejectUnauthorized: false
		}
	})
} else {
	console.log("connecting to local pg database at", process.env.DATABASE_LOCAL)
	pool = new Pool({
		user: process.env.DATABASE_LOCAL_USER,
		password: process.env.DATABASE_LOCAL_PASS, 
		host: process.env.DATABASE_LOCAL_HOST,
		port: process.env.DATABASE_LOCAL_PORT,
		database: process.env.DATABASE_LOCAL 
	})	
}

app.get('/db', async (req, res) => {
    try {
		const client = await pool.connect();
		const result = await client.query('SELECT * FROM test_table');
		const results = { 'results': (result) ? result.rows : null};
		console.log("rending results", results)
		res.send(JSON.stringify(results) );
		client.release();
	} catch (err) {
		console.error(err);
		res.send("~~Error " + err);
	}
})

const PORT = process.env.PORT || 80

// var io = socketio.listen(server)

// https://stackoverflow.com/questions/15135358/whats-the-best-way-to-implement-socket-io-as-a-submodule-within-expressjs
// https://stackoverflow.com/questions/35620811/running-two-socket-servers-on-same-port
// also the two apps that require socket.io use different namespaces: https://socket.io/docs/rooms-and-namespaces/
// var watio = require('./public/wat/subapp')(io)

// var cardio= require('./public/cards/cards-subapp')(io)
// app.use('/cards/images/rws', directory(path.resolve(__dirname, './public/cards/images/rws/')));

// app.use('/old', express.static(path.join(__dirname, 'old')))
app.use('/', express.static(path.join(__dirname, 'public')))

// app.use(vhost('kowl', (req, res, next)=>{
// 	res.send('woot')
// }))

app.use(express.json())
app.use(express.urlencoded({extended:true}))

server.listen(PORT)

console.log('Server running at http://127.0.0.1:' + PORT + '/');