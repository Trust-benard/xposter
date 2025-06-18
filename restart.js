const { spawn } = require('child_process');
const path = require('path');

console.log('Starting X Auto-Poster with auto-restart capability...');

function startServer() {
  const serverPath = path.join(__dirname, 'server.js');
  console.log(`Starting server from: ${serverPath}`);
  
  // Start the server process
  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    shell: true
  });
  
  // Handle server exit
  server.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    
    if (code !== 0) {
      console.log('Server crashed or exited with error. Restarting in 5 seconds...');
      setTimeout(startServer, 5000);
    } else {
      console.log('Server exited normally. Not restarting.');
    }
  });
  
  // Handle errors
  server.on('error', (err) => {
    console.error('Failed to start server process:', err);
    console.log('Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
  });
}

// Start the server initially
startServer();