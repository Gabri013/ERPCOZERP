const bcrypt = require('bcrypt');
const hash = '$2b$12$KbuW5zukbLFSxpn9OQ.Y3OVASqSmyETpqNNsgFvnX330iBb1Gtrey';
bcrypt.compare('master123_dev', hash).then(match => {
  console.log('Password matches:', match);
  process.exit(match ? 0 : 1);
}).catch(err => {
  console.error(err);
  process.exit(1);
});