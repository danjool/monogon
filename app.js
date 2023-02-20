const express = require('express')
const app = express()
const http = require('http')
const https = require('https')
const fs = require('fs')
// const directory = require('serve-index')
const path = require('path');
// const socketio = require('socket.io')
// const vhost = require('vhost')
const router = express.Router()
// let sqlite3 = require('sqlite3').verbose()
const { Pool } = require('pg');

const privateKey = fs.readFileSync('/etc/letsencrypt/live/monogon.net/privkey.pem', 'utf8')
const certificate = fs.readFileSync('/etc/letsencrypt/live/monogon.net/cert.pem', 'utf8')
const ca = fs.readFileSync('/etc/letsencrypt/live/monogon.net/chain.pem', 'utf8')

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
}

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

const httpServer = http.createServer(app)
const httpsServer = https.createServer(credentials, app);

httpServer.listen(port, () => console.log(`Listening on port ${port}`))

httpsServer.listen(443, ()=>{
    console.log('HTTPS Server running on port 443')
})