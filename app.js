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
  
  // HSTS header removed - nginx-proxy handles HTTPS
  
  next();
});

let pool, credentials

app.use((req, res, next) => { // expanded cert with>   sudo certbot certonly --expand --standalone -d monogon.net -d www.monogon.net -d wat.monogon.net -d noir.monogon.net -d bridge.monogon.net -d resume.monogon.net -d infinity.monogon.net
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
	// disabled bridge subdomain experiment because it's kinda not good
	// } else if (host.startsWith('bridge.')) {
	// 	// bridge.monogon.net - Star Trek TNG inspired subdomain
	// 	if (req.url.startsWith('/js/') || req.url.startsWith('/css/') || req.url.startsWith('/images/')) {
	// 		express.static(path.join(__dirname, 'public/bridge'))(req, res, next);
	// 	} else if (req.url === '/index.html' || req.url === '/') {
	// 		res.sendFile(path.join(__dirname, 'public/bridge.html'));
	// 	} else {
	// 		next();
	// 	}
	} else if (host.startsWith('resume.')) {
		res.sendFile(path.join(__dirname, 'public/resume/index.html'));
	} else if (host.startsWith('infinity.')) {
		if (req.url === '/index.html' || req.url === '/') {
			res.sendFile(path.join(__dirname, 'public/infinity.html'));
		} else {
			next();
		}
	} else {
	  next();
	}
});

app.use('/', express.static(path.join(__dirname, 'public')))

// JSON body parser with size limits to prevent DoS attacks
app.use(express.json({ limit: '1mb' }))

// SSL handling removed - nginx-proxy handles SSL termination
console.log('Running in HTTP mode - nginx-proxy handles SSL termination')

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
		// Check if pool is initialized
		if (!pool) {
			return res.status(503).send('Database not available');
		}
		
		const client = await pool.connect();
		try {
			const result = await client.query('SELECT * FROM test_table');
			const results = { 'results': (result) ? result.rows : null};
			console.log("Rendering database results");
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(results));
		} finally {
			// Ensure client is always released back to the pool
			client.release();
		}
	} catch (err) {
		console.error('Database query error:', err);
		// Don't expose error details to client
		res.status(500).send('Database error occurred');
	}
})

const PORT = process.env.PORT || 3000


// Parse URL-encoded bodies with size limits
app.use(express.urlencoded({
	extended: true,
	limit: '1mb'
}))

// Only HTTP server needed - nginx-proxy handles HTTPS
const httpServer = http.createServer(app)

// Configure Socket.IO with security options
const io = socketio({
  cors: {
    origin: ["https://monogon.net", "https://wat.monogon.net", "https://noir.monogon.net", "https://infinity.monogon.net"],
    methods: ["GET", "POST"],
    credentials: true
  },
  // Add ping timeout and interval for better connection management
  pingTimeout: 60000,
  pingInterval: 25000
});

// Attach Socket.IO to HTTP server only
io.attach(httpServer);

try {
	require('./public/wat/subapp')(io)
} catch (e) {
	console.log('errored starting wat subapp')
}


// Setup carpet-sweeper multiplayer
const { setupCarpetSweeperSocket } = require('./carpet-sweeper-socket')
setupCarpetSweeperSocket(io)

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

// Start HTTP server only - nginx-proxy forwards requests here
httpServer.listen(PORT, () => {
	console.log(`HTTP Server listening on port ${PORT} - nginx-proxy handles HTTPS`)
})
