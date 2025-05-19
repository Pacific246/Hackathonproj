import firebaseConfig from './firebaseConfig.js';

// Environment configuration
const config = {
  development: {
    firebase: firebaseConfig,
    apiUrl: 'http://localhost:3000',
    debug: true
  },
  production: {
    firebase: firebaseConfig,
    apiUrl: 'https://your-production-api.com',
    debug: false
  }
};

// Get current environment
const env = process.env.NODE_ENV || 'development';

// Export configuration
export default config[env]; 