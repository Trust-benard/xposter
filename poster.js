const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

const client = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

async function postTweet(content) {
  try {
    const tweet = await client.v2.tweet(content);
    console.log('Posted:', content.substring(0, 50) + (content.length > 50 ? '...' : ''));
    return tweet;
  } catch (error) {
    console.error('Error posting:', error.message);
    return null;
  }
}

module.exports = { postTweet };