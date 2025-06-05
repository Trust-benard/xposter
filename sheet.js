const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

async function getSheetData() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('SPREADSHEET_ID is not defined in environment variables');
    }
    
    // Simplified range: A2:B (Tweet, Posted)
    const range = 'Sheet1!A2:B';

    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    return response.data.values || [];
  } catch (error) {
    console.error('Error fetching sheet data:', error.message);
    return [];
  }
}

async function markAsPosted(rowIndex) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    // Add 2 because our data starts from row 2 (row 1 is headers)
    const row = rowIndex + 2;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!B${row}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [['yes']]
      }
    });
    
    console.log(`Marked row ${row} as posted`);
    return true;
  } catch (error) {
    console.error('Error marking as posted:', error.message);
    return false;
  }
}

module.exports = { getSheetData, markAsPosted };