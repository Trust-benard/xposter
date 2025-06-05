require('dotenv').config();
const { schedulePosts } = require('./cronjob');
const { getSheetData } = require('./sheet');

console.log('Starting X auto-poster...');
console.log(`Time: ${new Date().toISOString()}`);

// Check for required environment variables
const requiredEnvVars = ['API_KEY', 'API_SECRET', 'ACCESS_TOKEN', 'ACCESS_TOKEN_SECRET', 'SPREADSHEET_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName] || process.env[varName] === `your_${varName.toLowerCase()}`);

if (missingVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  console.error('Please update your .env file with the correct values.');
  process.exit(1);
}

// Start the scheduler
async function start() {
  try {
    // Test spreadsheet connection
    console.log('Testing spreadsheet connection...');
    const posts = await getSheetData();
    console.log(`Successfully connected to spreadsheet. Found ${posts.length} posts.`);
    
    // Start the scheduler
    schedulePosts();
    console.log('Auto-poster started successfully. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Failed to start auto-poster:', error);
    process.exit(1);
  }
}

start();