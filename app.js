const express = require('express')
const app = express()
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path');
const socketio = require('socket.io')

// Add security headers middleware
app.use((req, res, next) => {
  // Prevents browsers from interpreting files as a different MIME type
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevents your site from being framed by other sites (clickjacking protection)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Enables browser XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Forces browsers to use HTTPS for a specified period
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
});

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
	const privateKey = fs.readFileSync('/etc/letsencrypt/live/monogon.net-0001/privkey.pem', 'utf8')
	const certificate = fs.readFileSync('/etc/letsencrypt/live/monogon.net-0001/cert.pem', 'utf8')
	const ca = fs.readFileSync('/etc/letsencrypt/live/monogon.net-0001/chain.pem', 'utf8')
	credentials = {
		key: privateKey,
		cert: certificate,
		ca: ca,
	}
} catch(err) {
	console.error(err)
}

// Input validation helper
const validateInput = (input, pattern) => {
	if (typeof input !== 'string') return false;
	return pattern.test(input);
};

app.get('/annotate/works', (req, res) => {
    fs.readdir('public/annotate/works', (err, files) => {
        if (err) {
            console.error('Error reading annotate works directory:', err);
            return res.status(500).send('Internal server error');
        }
        res.status(200).send(files.filter(file => file.endsWith('.txt')).map(file => file.replace('.txt', '')));
    });
});

app.post('/annotate/updateRefs', (req, res) => {
    const refs = req.body.refs;
    const workId = req.body.workId;
    
    // Validate workId to prevent path traversal
    if (!workId || !validateInput(workId, /^[a-zA-Z0-9_-]+$/)) {
        return res.status(400).send('Invalid workId');
    }
    
    // Validate refs structure
    if (!refs || typeof refs !== 'object') {
        return res.status(400).send('Invalid refs data');
    }
    
    console.log('Updating refs for workId:', workId);

	const htmlStringSanitizer = (str) => {
		if (typeof str !== 'string') return '';
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	};

    // Sanitize all annotations
    for (const key in refs) {
		if (!refs[key] || !refs[key].annotation) {
			delete refs[key];
		} else {
			refs[key].annotation = htmlStringSanitizer(refs[key].annotation);
		}
	}

    const filePath = path.join(__dirname, 'public', 'annotate', 'works', `${workId}-refs.json`);
    
    // Ensure the path is within the intended directory
    if (!filePath.startsWith(path.join(__dirname, 'public', 'annotate', 'works'))) {
        return res.status(403).send('Access denied');
    }

    fs.writeFile(filePath, JSON.stringify(refs, null, 2), err => {
        if (err) {
			console.error('Error writing refs file:', err);
			return res.status(500).send('Internal server error');
		}
        res.status(200).send('References updated successfully');
    });
});

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
