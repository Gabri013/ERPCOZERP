const { AuthService } = require('./src/services/authService');

AuthService.authenticate('master@base44.com', 'master123_dev', '127.0.0.1', 'test')
  .then(res => console.log('SUCCESS:', JSON.stringify(res, null, 2)))
  .catch(err => console.error('ERROR:', err.message));