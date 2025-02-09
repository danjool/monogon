const express = require('express')
const app = express()
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path');
const socketio = require('socket.io')

let pool, credentials

app.use((req, res, next) => { // expanded cert with  sudo certbot certonly --standalone -d monogon.net -d wat.monogon.net, added to wat. cname to Route 53, value is monogon.net
	const host = req.get('host');
	if (host.startsWith('wat.')) {
	  	express.static(path.join(__dirname, 'public/wat'))(req, res, next);
	} else if (host.startsWith('noir.')){
		// noir.monogon.net/images/
		if(req.url.startsWith('/images/')) {
			express.static(path.join(__dirname, 'public/noir/images'))(req, res, next);
		} else if (req.url === '/index.html' || req.url === '/') {
			res.sendFile(path.join(__dirname, 'public/noir.html'));
		}
	} else {
	  next();
	}
});

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


app.use(express.urlencoded({extended:true}))

const httpServer = http.createServer(app)
const httpsServer = https.createServer(credentials, app);

const io = socketio()
io.attach(httpServer)
io.attach(httpsServer)

require('./public/wat/subapp')(io)

const cardsNsp = io.of('/cards')

let gameState = {
	selected: [],
	shuffle: [],
	whichAreFaceUp: [],
}

cardsNsp.on('connection', (socket) => {
	console.log('Client connected to cards namespace')
	
	socket.emit('take note', { state: gameState })
  
	socket.on('take note', (data) => {
	  if (data && data.state) {
		gameState = data.state
		socket.broadcast.emit('take note', { state: gameState })
	  }
	})
})

httpServer.listen(PORT, () => console.log(`Listening on port ${PORT}`))

httpsServer.listen(443, ()=>{
    console.log('HTTPS Server running on port 443')
})
