const express = require('express')
const app = express()
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path');
const socketio = require('socket.io')

// Security middleware
app.use((req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://ajax.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data:;");
  
  next();
});

// Basic rate limiting
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!app.locals.requestCounts) {
    app.locals.requestCounts = {};
  }
  
  if (!app.locals.requestCounts[ip]) {
    app.locals.requestCounts[ip] = {
      count: 1,
      firstRequest: now
    };
  } else {
    // Reset count if it's been more than a minute
    if (now - app.locals.requestCounts[ip].firstRequest > 60000) {
      app.locals.requestCounts[ip] = {
        count: 1,
        firstRequest: now
      };
    } else {
      app.locals.requestCounts[ip].count++;
      
      // If more than 200 requests in a minute, return 429 Too Many Requests
      if (app.locals.requestCounts[ip].count > 200) {
        return res.status(429).send('Too many requests, please try again later.');
      }
    }
  }
  
  next();
});

// Clean up request counts periodically
setInterval(() => {
  const now = Date.now();
  if (app.locals.requestCounts) {
    Object.keys(app.locals.requestCounts).forEach(ip => {
      if (now - app.locals.requestCounts[ip].firstRequest > 300000) {
        delete app.locals.requestCounts[ip];
      }
    });
  }
}, 300000);

let pool, credentials

// Subdomain routing with validation
app.use((req, res, next) => { // expanded cert with  sudo certbot certonly --standalone -d monogon.net -d wat.monogon.net, added to wat. cname to Route 53, value is monogon.net
	const host = req.get('host');
	
	// Validate host to prevent host header injection
	if (!host || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(host)) {
		return res.status(400).send('Invalid host');
	}
	
	if (host.startsWith('wat.')) {
		express.static(path.join(__dirname, 'public/wat'), {
			maxAge: '1d' // Cache static assets for 1 day
		})(req, res, next);
	} else if (host.startsWith('noir.')){
		// noir.monogon.net/images/
		if(req.url.startsWith('/images/')) {
			express.static(path.join(__dirname, 'public/noir/images'), {
				maxAge: '1d'
			})(req, res, next);
		} else if (req.url === '/index.html' || req.url === '/') {
			res.sendFile(path.join(__dirname, 'public/noir.html'));
		} else {
			next();
		}
	} else if (host.startsWith('lcars.')) {
		// lcars.monogon.net
		if (req.url.startsWith('/js/') || req.url.startsWith('/css/') || req.url.startsWith('/images/')) {
			express.static(path.join(__dirname, 'public/lcars'))(req, res, next);
		} else if (req.url === '/index.html' || req.url === '/') {
			res.sendFile(path.join(__dirname, 'public/lcars.html'));
		} else {
			next();
		}
	} else {
		next();
	}
});

// Serve static files with caching
app.use('/', express.static(path.join(__dirname, 'public'), {
	maxAge: '1d' // Cache static assets for 1 day
}))

// JSON body parser with size limits
app.use(express.json({ limit: '1mb' }))

// Load SSL certificates with proper error handling
try {
	const privateKey = fs.readFileSync('/etc/letsencrypt/live/monogon.net-0001/privkey.pem', 'utf8')
	const certificate = fs.readFileSync('/etc/letsencrypt/live/monogon.net-0001/cert.pem', 'utf8')
	const ca = fs.readFileSync('/etc/letsencrypt/live/monogon.net-0001/chain.pem', 'utf8')
	credentials = {
		key: privateKey,
		cert: certificate,
		ca: ca,
		// Modern secure cipher configuration
		honorCipherOrder: true,
		minVersion: 'TLS1.2'
	}
} catch(err) {
	console.error('Error loading SSL certificates:', err)
}

// Input validation helper
const validateInput = (input, pattern) => {
	if (typeof input !== 'string') return false;
	return pattern.test(input);
};

// Annotate works route with improved error handling
app.get('/annotate/works', (req, res) => {
    fs.readdir('public/annotate/works', (err, files) => {
        if (err) {
			console.error('Error reading annotate works directory:', err);
			return res.status(500).send('Internal server error');
		}
        res.status(200).send(files.filter(file => file.endsWith('.txt')).map(file => file.replace('.txt', '')));
    });
});

// Annotate updateRefs route with validation and sanitization
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

// Database route with improved error handling
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
});

const PORT = process.env.PORT || 80

// Parse URL-encoded bodies with size limits
app.use(express.urlencoded({
	extended: true,
	limit: '1mb'
}));

// Create HTTP and HTTPS servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

// Configure Socket.IO with security options
const io = socketio({
	cors: {
		origin: ["https://monogon.net", "https://wat.monogon.net", "https://noir.monogon.net", "https://lcars.monogon.net"],
		methods: ["GET", "POST"],
		credentials: true
	},
	// Add ping timeout and interval for better connection management
	pingTimeout: 60000,
	pingInterval: 25000
});

io.attach(httpServer);
io.attach(httpsServer);

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

// Global error handler
app.use((err, req, res, next) => {
	console.error('Unhandled error:', err);
	res.status(500).send('Internal server error');
});

// Start servers with error handling
httpServer.listen(PORT, () => console.log(`HTTP server listening on port ${PORT}`));
httpServer.on('error', (error) => {
	console.error('HTTP server error:', error);
});

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});
httpsServer.on('error', (error) => {
	console.error('HTTPS server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down gracefully');
	httpServer.close(() => {
		console.log('HTTP server closed');
	});
	httpsServer.close(() => {
		console.log('HTTPS server closed');
	});
});
