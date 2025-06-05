# X Auto-Poster

A simple Node.js application that automatically posts tweets from a Google Sheet to X (formerly Twitter) on a scheduled basis.

## Features

- Posts 10 times per day during daytime hours (8 AM to 5 PM)
- Automatically cycles through available tweets
- Tracks posted tweets to avoid duplicates
- Uses Google Sheets as a simple content management system
- Easy to set up and maintain

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

### Running Locally

```
npm start
```

### Running as a Service

For continuous operation, use PM2:

```
npm install -g pm2
pm2 start index.js
pm2 startup
pm2 save
```

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

## Deployment Options

- Local machine (requires computer to be on during posting times)
- Cloud services like Railway.app, Render.com, or AWS EC2
- Any Node.js hosting platform

## Security Notes

- Never commit your `.env` file or `credentials.json` to version control
- Add both files to your `.gitignore`
- Regenerate credentials if they are ever exposed

## License

ISC