// Gera token JWT para admin (modo mock)
const jwt = require('jsonwebtoken');

const secret = 'dev_jwt_secret_change_me_please_12345';
const payload = {
  id: '2',
  userId: '2',
  email: 'admin@erpcoz.local',
  roles: ['admin'],
  // exp: 1 hora a partir de agora (em segundos)
  // Mas jwt.sign com expiresIn cuida disso
};

const token = jwt.sign(payload, secret, { expiresIn: '7d' });
console.log(token);
