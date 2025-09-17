// Application configuration
console.log(REACT_APP_GOOGLE_CLIENT_ID);

const config = {
  google: {
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  },
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  },
};

// Validate required configurations
if (!config.google.clientId || config.google.clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
  console.error('Google OAuth Client ID is not configured. Please check your .env file.');
}

export default config;
