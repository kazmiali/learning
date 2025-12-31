const fs = require('fs-extra');
const path = require('path');

const sourcePath = path.resolve(__dirname, '../../docs');
const destinationPath = path.resolve(__dirname, '../public/docs');

async function copyDocs() {
  try {
    await fs.copy(sourcePath, destinationPath, { overwrite: true });
    console.log('Successfully copied docs to public directory');
  } catch (error) {
    console.error('Error copying docs:', error);
  }
}

copyDocs();
