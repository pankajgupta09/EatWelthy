// client/src/config.js
const config = {
  backendUrl: process.env.NODE_ENV === 'production'
    ? 'https://eatwelthy-backend.onrender.com'
    : 'http://localhost:5050',
  defaultErrorMsg: 'An error occurred. Please try again.'
};

export default config;