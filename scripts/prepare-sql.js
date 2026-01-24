const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy the PGlite database tarball
try {
  const dbSrc = path.join(projectRoot, 'db', 'notion.db.tar.gz');
  const dbDest = path.join(publicDir, 'notion.db.tar.gz');
  fs.copyFileSync(dbSrc, dbDest);
  console.log('Copied notion.db.tar.gz to public/.');
} catch (err) {
  console.warn('Could not copy notion.db.tar.gz:', err);
}
