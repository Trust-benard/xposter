# X Auto-Poster

A simple Node.js application that automatically posts tweets from a Google Sheet to X (formerly Twitter) on a scheduled basis.

## Features

- Posts 10 times per day during daytime hours (8 AM to 5 PM)
- Posts tweets in sequential order from your spreadsheet
- Tracks posted tweets to avoid duplicates
- Uses Google Sheets as a simple content management system
- Auto-restarts if the application becomes unresponsive
- Express API for monitoring and manual control

## Setup

### Prerequisites

- Node.js installed on your system
- Twitter Developer Account with API credentials
- Google Cloud Project with Sheets API enabled
- Google Service Account with access to your spreadsheet

### Installation

1. Clone this repository
```
git clone https://github.com/yourusername/xposter.git
cd xposter
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file with your credentials
```
API_KEY=your_twitter_api_key
API_SECRET=your_twitter_api_secret
ACCESS_TOKEN=your_twitter_access_token
ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
SPREADSHEET_ID=your_google_spreadsheet_id
PORT=3000
```

4. Place your Google Service Account credentials in `credentials.json`

### Google Sheet Setup

Create a Google Sheet with the following structure:

| A: Tweet Content | B: Posted |
|-----------------|----------|
| Your tweet text | yes/blank |
| Another tweet | |

- Column A: The content of your tweet
- Column B: Will be filled with "yes" after posting (leave blank initially)

Share your Google Sheet with the email address from your service account.

## Usage

### Running the Application

```
npm start
```

This will start the application with auto-restart capability. If the application crashes or becomes unresponsive, it will automatically restart.

## Self-Healing Features

The application includes two levels of self-healing:

1. **Internal Watchdog Timer**: Detects if the application becomes unresponsive and triggers a restart
2. **External Process Monitor**: The restart.js script monitors the main application and restarts it if it crashes

## API Endpoints

- `GET /` - Check if the service is running
- `GET /api/status` - Get posting statistics and next scheduled post time
- `POST /api/post-now` - Manually trigger a post (posts the next available tweet)

## Posting Schedule

The application posts once per hour at:
- 8:00 AM
- 9:00 AM
- 10:00 AM
- 11:00 AM
- 12:00 PM
- 1:00 PM
- 2:00 PM
- 3:00 PM
- 4:00 PM
- 5:00 PM

## How Posts Are Selected

The application always selects the first unposted tweet in your spreadsheet. This means:

1. Tweets are posted in the exact order they appear in your spreadsheet
2. No tweets are skipped
3. Each tweet is posted exactly once

To prioritize certain tweets, simply move them to the top of your spreadsheet.

## Security Notes

- Never commit your `.env` file or `credentials.json` to version control
- Add both files to your `.gitignore`
- Regenerate credentials if they are ever exposed

## License

ISC