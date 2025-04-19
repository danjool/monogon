const axios = require('axios');
const { io } = require('socket.io-client');

// Simple color function replacements for chalk
const colors = {
  red: text => `\x1b[31m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  blue: text => `\x1b[34m${text}\x1b[0m`
};

// Configuration 
const config = {
  domains: [
    { host: 'monogon.net', path: '/', expectedTitle: /<h1>Monogon<\/h1>/ },
    { host: 'wat.monogon.net', path: '/', expectedTitle: /Wat/ },
    { host: 'noir.monogon.net', path: '/', expectedTitle: /Monogon Noir/ },
    { host: 'bridge.monogon.net', path: '/', expectedTitle: /bridge/ },
    { host: 'resume.monogon.net', path: '/', expectedTitle: /Daniel Martin.*Resume/ },
    { host: 'infinity.monogon.net', path: '/', expectedTitle: /<h1 data-text="Monogon">Monogon<\/h1>/ },
  ],
  sockets: [
    { namespace: '', events: ['connect'] },
    { namespace: '/cards', events: ['connect', 'take note'] }
  ],
  requestTimeout: 10000,
  socketTimeout: 5000
};

// Helper functions
const formatResult = (name, success, message = '') => {
  const status = success ? colors.green('✓ PASS') : colors.red('✗ FAIL');
  return `${status} ${name}${message ? ': ' + message : ''}`;
};

const timeoutPromise = (ms, message) => 
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

// Test runners
async function testSubdomain({ host, path, expectedTitle }) {
  const testName = `${host}${path}`;
  try {
    const url = `https://${host}${path}`;
    const response = await axios.get(url, { timeout: config.requestTimeout });
    
    if (response.status !== 200) {
      return formatResult(testName, false, `Status ${response.status}`);
    }
    
    if (!expectedTitle.test(response.data)) {
      return formatResult(testName, false, 'Content validation failed');
    }
    
    return formatResult(testName, true);
  } catch (error) {
    return formatResult(testName, false, error.message);
  }
}

async function testSocket({ namespace, events }) {
  const testName = `Socket${namespace ? ' ' + namespace : ''}`;
  return new Promise(resolve => {
    try {
      // Connect to socket
      const socket = io(`https://monogon.net${namespace}`, {
        transports: ['websocket'],
        secure: true,
        rejectUnauthorized: false
      });
      
      // Track received events
      const receivedEvents = new Set();
      
      // Add handlers for expected events
      events.forEach(event => {
        socket.on(event, (data) => {
          receivedEvents.add(event);
          
          // When we've received all expected events, we're done
          if (events.every(e => receivedEvents.has(e))) {
            socket.disconnect();
            resolve(formatResult(testName, true));
          }
        });
      });
      
      // Handle connection error
      socket.on('connect_error', (error) => {
        socket.disconnect();
        resolve(formatResult(testName, false, `Connection error: ${error.message}`));
      });
      
      // Set timeout for socket test
      setTimeout(() => {
        const missing = events.filter(e => !receivedEvents.has(e));
        socket.disconnect();
        resolve(formatResult(testName, false, `Timed out waiting for: ${missing.join(', ')}`));
      }, config.socketTimeout);
      
    } catch (error) {
      resolve(formatResult(testName, false, error.message));
    }
  });
}

// Execute all tests in parallel for efficiency
async function runTests() {
  console.log(colors.blue('=== Monogon.net Production Test ==='));
  console.log(colors.blue('Testing Subdomains...'));
  
  // Run all subdomain tests in parallel
  const subdomainResults = await Promise.all(
    config.domains.map(testSubdomain)
  );
  
  console.log(subdomainResults.join('\n'));
  console.log(colors.blue('\nTesting Socket.IO...'));
  
  // Run all socket tests in parallel
  const socketResults = await Promise.all(
    config.sockets.map(testSocket)
  );
  
  console.log(socketResults.join('\n'));
  
  // Determine overall test status
  const allTests = [...subdomainResults, ...socketResults];
  const failedTests = allTests.filter(result => result.includes('FAIL')).length;
  
  console.log(colors.blue('\n=== Test Summary ==='));
  console.log(`Total: ${allTests.length}, Passed: ${allTests.length - failedTests}, Failed: ${failedTests}`);
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error(colors.red('Test execution error:'), error);
  process.exit(1);
});
