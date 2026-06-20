const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, 'package.json');
const indexHtmlPath = path.join(__dirname, 'index.html');

try {
  // 1. Read and update package.json
  if (!fs.existsSync(packageJsonPath)) {
    console.error('package.json not found!');
    process.exit(1);
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version || '1.0.0';
  const versionParts = currentVersion.split('.').map(Number);
  
  if (versionParts.some(isNaN) || versionParts.length !== 3) {
    console.error(`Invalid version format in package.json: ${currentVersion}`);
    process.exit(1);
  }
  
  versionParts[2] += 1; // Bump patch version
  const newVersion = versionParts.join('.');
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

  // 2. Read and update index.html
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('index.html not found!');
    process.exit(1);
  }
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const versionRegex = /(<span[^>]*id=["']appVersion["'][^>]*>\s*v?)(\d+\.\d+\.\d+)(\s*<\/span>)/;
  
  if (versionRegex.test(indexHtml)) {
    indexHtml = indexHtml.replace(versionRegex, `$1${newVersion}$3`);
    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
    console.log(`Successfully bumped version from v${currentVersion} to v${newVersion} in package.json and index.html`);
  } else {
    // If the span doesn't exist yet, we will log it. (We will add it to index.html next).
    console.warn('Warning: Could not find element with id="appVersion" in index.html. Only updated package.json.');
  }

  // 3. Stage the files if we are in git environment and changes are made
  try {
    execSync('git add package.json index.html');
    console.log('Staged updated version files in Git.');
  } catch (gitError) {
    // Fail silently if git is not configured or in environments where git commands are not accessible
  }
} catch (err) {
  console.error('Error updating version:', err);
  process.exit(1);
}
