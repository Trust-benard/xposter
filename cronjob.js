const cron = require('node-cron');
const dayjs = require('dayjs');
const { getSheetData, markAsPosted } = require('./sheet');
const { postTweet } = require('./poster');

// Schedule posts 10 times a day during daytime (8 AM to 6 PM)
const times = [
  '0 8 * * *',    // 8:00 AM
  '0 9 * * *',    // 9:00 AM
  '0 10 * * *',   // 10:00 AM
  '0 11 * * *',   // 11:00 AM
  '0 12 * * *',   // 12:00 PM
  '0 13 * * *',   // 1:00 PM
  '0 14 * * *',   // 2:00 PM
  '0 15 * * *',   // 3:00 PM
  '0 16 * * *',   // 4:00 PM
  '0 17 * * *',   // 5:00 PM
];

async function schedulePosts() {
  console.log('Scheduling posts at the following times:');
  times.forEach(time => console.log(`- ${time} (cron format)`));

  // Post at each scheduled time
  times.forEach(time => {
    cron.schedule(time, async () => {
      try {
        console.log(`Running scheduled post at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
        const posts = await getSheetData();
        
        if (posts.length === 0) {
          return console.log('No posts available in the spreadsheet');
        }

        // Find the first unposted tweet
        const nextPostIndex = posts.findIndex(post => {
          const [, posted] = post;
          return !posted || posted.toLowerCase() !== 'yes';
        });

        if (nextPostIndex === -1) {
          return console.log('All posts have been published');
        }

        const [content] = posts[nextPostIndex];
        
        // Skip if content is empty
        if (!content || content.trim() === '') {
          console.log('Skipping empty post');
          return;
        }
        
        console.log(`Posting content: "${content.substring(0, 30)}..."`);
        
        // Post the tweet
        const result = await postTweet(content);
        
        if (result) {
          console.log(`Successfully posted tweet at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
          console.log(`Tweet ID: ${result.data.id}`);
          
          // Mark as posted in the spreadsheet
          await markAsPosted(nextPostIndex);
        } else {
          console.log(`Failed to post tweet, will retry next time`);
        }
      } catch (error) {
        console.error('Error in scheduled post:', error);
      }
    });
  });

  // Add a daily status check
  cron.schedule('0 0 * * *', async () => {
    try {
      const posts = await getSheetData();
      const postedCount = posts.filter(post => post[1] === 'yes').length;
      const pendingCount = posts.length - postedCount;
      
      console.log(`Daily status: ${postedCount} posts published, ${pendingCount} posts pending`);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  });
}

module.exports = { schedulePosts };