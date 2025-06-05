const express = require('express');
const { schedulePosts } = require('./cronjob');
const { getSheetData, markAsPosted } = require('./sheet');
const { postTweet } = require('./poster');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

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
      nextPostTime: getNextPostTime()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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

// Start the server and scheduler
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  schedulePosts(); // Start the scheduler
});