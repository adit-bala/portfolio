const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy sql-wasm.wasm from sql.js dist
try {
  const wasmSrc = require.resolve('sql.js/dist/sql-wasm.wasm');
  const wasmDest = path.join(publicDir, 'sql-wasm.wasm');
  fs.copyFileSync(wasmSrc, wasmDest);
  console.log('Copied sql-wasm.wasm to public/.');
} catch (err) {
  console.warn('Could not copy sql-wasm.wasm:', err);
}

// Copy the local SQLite database
try {
  const dbSrc = path.join(projectRoot, 'db', 'notion.db');
  const dbDest = path.join(publicDir, 'notion.db');
  fs.copyFileSync(dbSrc, dbDest);
  console.log('Copied notion.db to public/.');
} catch (err) {
  console.warn('Could not copy notion.db:', err);
} 