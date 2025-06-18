const express = require('express');
const { schedulePosts } = require('./cronjob');
const { getSheetData, markAsPosted } = require('./sheet');
const { postTweet } = require('./poster');
require('dotenv').config();

// Set up uncaught exception handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Application will restart in 5 seconds...');
  
  // Log the error and restart after a short delay
  setTimeout(() => {
    console.log('Restarting application...');
    process.exit(1); // Exit with error code
  }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Application will restart in 5 seconds...');
  
  // Log the error and restart after a short delay
  setTimeout(() => {
    console.log('Restarting application...');
    process.exit(1); // Exit with error code
  }, 5000);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('X Auto-Poster is running');
});

// Get status
app.get('/api/status', async (req, res) => {
  try {
    const posts = await getSheetData();
    const postedCount = posts.filter(post => post[1] === 'yes').length;
    const pendingCount = posts.length - postedCount;
    
    res.json({
      status: 'running',
      totalPosts: posts.length,
      postedCount,
      pendingCount,
      nextPostTime: getNextPostTime(),
      uptime: Math.floor(process.uptime()),
      startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      lastWatchdogReset: lastWatchdogReset.toISOString()
    });
  } catch (error) {
    console.error('Status API error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Post now (manual override)
app.post('/api/post-now', async (req, res) => {
  try {
    const posts = await getSheetData();
    
    // Find first unposted tweet
    const index = posts.findIndex(post => !post[1] || post[1].toLowerCase() !== 'yes');
    
    if (index === -1) {
      return res.status(404).json({ error: 'No unposted tweets available' });
    }
    
    const [content] = posts[index];
    
    // Post the tweet
    const result = await postTweet(content);
    
    if (result) {
      await markAsPosted(index);
      res.json({ 
        success: true, 
        message: 'Tweet posted successfully',
        tweetId: result.data.id,
        content: content.substring(0, 30) + (content.length > 30 ? '...' : '')
      });
    } else {
      res.status(500).json({ error: 'Failed to post tweet' });
    }
  } catch (error) {
    console.error('Post now API error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Helper function to get next post time
function getNextPostTime() {
  const now = new Date();
  const hour = now.getHours();
  
  // Posting hours are 8-17 (8 AM to 5 PM)
  if (hour >= 17) {
    // After 5 PM, next post is at 8 AM tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow;
  } else if (hour < 8) {
    // Before 8 AM, next post is at 8 AM today
    const today = new Date();
    today.setHours(8, 0, 0, 0);
    return today;
  } else {
    // During posting hours, next post is at the next hour
    const nextHour = new Date();
    nextHour.setHours(hour + 1, 0, 0, 0);
    return nextHour;
  }
}

// Watchdog timer to detect if the application becomes unresponsive
let watchdogTimer;
let lastWatchdogReset = new Date();

function resetWatchdog() {
  if (watchdogTimer) clearTimeout(watchdogTimer);
  lastWatchdogReset = new Date();
  
  // If no activity for 10 minutes, restart the application
  watchdogTimer = setTimeout(() => {
    console.error('Watchdog timer expired - no activity detected for 10 minutes');
    console.error('Application will restart...');
    process.exit(1); // Exit with error code
  }, 10 * 60 * 1000); // 10 minutes
}

// Reset watchdog on startup
resetWatchdog();

// Reset watchdog every minute
setInterval(() => {
  console.log(`Health check: ${new Date().toISOString()} - Uptime: ${Math.floor(process.uptime())} seconds`);
  resetWatchdog();
}, 60000); // Every minute

// Start the server and scheduler
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
  
  // Start the scheduler
  try {
    schedulePosts();
    console.log('Scheduler started successfully');
  } catch (error) {
    console.error('Failed to start scheduler:', error);
    // Exit with error code
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});