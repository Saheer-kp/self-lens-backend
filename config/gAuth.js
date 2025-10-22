const { google } = require("googleapis");

const gOAuth2Client = new google.auth.OAuth2(
  process.env.G_CLIENT_ID, // Your Google Client ID
  process.env.G_CLIENT_SECRET, // Your Google Client Secret
  process.env.G_REDIRECT_URI // Your redirect URI
);

module.exports = { gOAuth2Client, google };
