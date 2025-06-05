const express = require('express');
const bodyParser = require('body-parser');
const { getSheetData, markAsPosted, addNewPost } = require('./sheet');
const { postTweet } = require('./poster');
const { schedulePosts } = require('./cronjob');
const dayjs = require('dayjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', async (req, res) => {
  try {
    const posts = await getSheetData();
    res.render('dashboard', { 
      posts,
      today: dayjs().format('YYYY-MM-DD')
    });
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await getSheetData();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new post
app.post('/api/posts', async (req, res) => {
  try {
    const { mainTweet, threadReplies, type, tags, scheduledDate } = req.body;
    await addNewPost(mainTweet, threadReplies, type, tags, scheduledDate);
    res.redirect('/');
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Post now (manual override)
app.post('/api/post-now/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const posts = await getSheetData();
    
    if (index < 0 || index >= posts.length) {
      return res.status(400).json({ error: 'Invalid post index' });
    }
    
    const post = posts[index];
    const [content, threadContent, type, tags] = post;
    
    // Parse thread content if available
    const thread = threadContent ? threadContent.split('|').map(t => t.trim()).filter(t => t !== '') : [];
    
    // Add tags if available
    const contentWithTags = tags ? `${content}\n\n${tags}` : content;
    
    // Post the tweet and thread
    const result = await postTweet(contentWithTags, thread);
    
    if (result) {
      await markAsPosted(index);
      res.json({ success: true, message: 'Post published successfully' });
    } else {
      res.status(500).json({ error: 'Failed to post tweet' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server and scheduler
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  schedulePosts(); // Start the scheduler
});