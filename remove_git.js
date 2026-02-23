const fs = require('fs');
const path = 'C:/Users/user/orchids-projects/purple-tiglon/client/.git';
try {
  fs.rmSync(path, { recursive: true, force: true });
  console.log('DELETED');
} catch(e) {
  console.log('ERROR:', e.message);
}
