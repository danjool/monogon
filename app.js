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

let pool, credentials

app.use('/', express.static(path.join(__dirname, 'public')))
app.use(express.json())

try {
	const privateKey = fs.readFileSync('/etc/letsencrypt/live/monogon.net/privkey.pem', 'utf8')
	const certificate = fs.readFileSync('/etc/letsencrypt/live/monogon.net/cert.pem', 'utf8')
	const ca = fs.readFileSync('/etc/letsencrypt/live/monogon.net/chain.pem', 'utf8')
	credentials = {
		key: privateKey,
		cert: certificate,
		ca: ca,
	}
} catch(err) {
	console.error(err)
}

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

app.get('/annotate/works', (req, res) => {
    fs.readdir('public/annotate/works', (err, files) => {
        if (err) console.log('err', err)
        res.status(200).send(files.map(file => file.replace('.txt', '')))
    })
})

app.post('/annotate/updateRefs', (req, res) => {
    const refs = req.body.refs
	console.log('refs', refs)
    const workId = req.body.workId

	const htmlStringSanitizer = (str) => {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
	}

    for (const key in refs) {
		if (refs[key].annotation === "") delete refs[key]
		else refs[key].annotation = htmlStringSanitizer(refs[key].annotation)
	}

    fs.writeFile(`public/annotate/works/${workId}-refs.json`, JSON.stringify(refs, null, 2), err => {
        if (err) {
			console.log('err', err)
			res.status(500).send()
		}
        res.status(200).send()
    })
})

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


// app.use(vhost('kowl', (req, res, next)=>{
// 	res.send('woot')
// }))


app.use(express.urlencoded({extended:true}))

const httpServer = http.createServer(app)
const httpsServer = https.createServer(credentials, app);

httpServer.listen(PORT, () => console.log(`Listening on port ${PORT}`))

httpsServer.listen(443, ()=>{
    console.log('HTTPS Server running on port 443')
})