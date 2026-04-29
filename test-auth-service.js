const { AuthService } = require('./src/services/authService');

async function test() {
  try {
    const result = await AuthService.authenticate(
      'master@base44.com',
      'master123_dev',
      '127.0.0.1',
      'test-agent'
    );
    console.log('Auth success:', result);
    process.exit(0);
  } catch (err) {
    console.error('Auth error:', err.message);
    process.exit(1);
  }
}

test();