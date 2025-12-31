const fs = require('fs-extra');
const path = require('path');

const docsPath = path.resolve(__dirname, '../../docs');
const outputPath = path.resolve(__dirname, '../src/docs.json');

function getDirectoryTree(dirPath) {
  const stats = fs.statSync(dirPath);
  const name = path.basename(dirPath);

  if (stats.isDirectory()) {
    const children = fs.readdirSync(dirPath).map(child => {
      return getDirectoryTree(path.join(dirPath, child));
    });
    return { name, type: 'directory', children };
  } else {
    return { name, type: 'file' };
  }
}

async function generateJson() {
  try {
    const tree = getDirectoryTree(docsPath);
    await fs.writeJson(outputPath, tree, { spaces: 2 });
    console.log('Successfully generated docs.json');
  } catch (error) {
    console.error('Error generating docs.json:', error);
  }
}

generateJson();
