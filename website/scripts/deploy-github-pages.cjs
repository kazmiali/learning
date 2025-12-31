const fs = require('fs-extra');
const path = require('path');

// Read current vite.config.ts
const configPath = path.resolve(__dirname, '../vite.config.ts');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace base path for GitHub Pages deployment
configContent = configContent.replace(
  /base: ['"][^'"]+['"],/,
  "base: '/learning/',"
);

// Write temporary config for deployment
fs.writeFileSync(configPath, configContent);

console.log('Configured for GitHub Pages deployment');

// Run the actual deployment
const { exec } = require('child_process');

exec('npm run build && gh-pages -d dist', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  
  console.log(stdout);
  console.error(stderr);
  
  // Restore original config
  const originalConfig = fs.readFileSync(configPath, 'utf8');
  const restoredConfig = originalConfig.replace(
    /base: ['"][^'"]+['"],/,
    "base: './',"
  );
  fs.writeFileSync(configPath, restoredConfig);
  
  console.log('Restored local development config');
});
