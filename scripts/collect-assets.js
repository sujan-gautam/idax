const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const webDistPath = path.join(__dirname, '../apps/web/dist');
const apiPublicPath = path.join(__dirname, '../api/dist/public');

console.log('--- Collecting Frontend Assets ---');

// Ensure web dist exists
if (!fs.existsSync(webDistPath)) {
    console.error(`Error: Web dist folder not found at ${webDistPath}. Please run build:web first.`);
    process.exit(1);
}

// Ensure api dist public exists
if (!fs.existsSync(apiPublicPath)) {
    console.log(`Creating directory: ${apiPublicPath}`);
    fs.mkdirSync(apiPublicPath, { recursive: true });
}

// Move files recursively
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

try {
    console.log(`Copying files from ${webDistPath} to ${apiPublicPath}...`);
    copyRecursiveSync(webDistPath, apiPublicPath);
    console.log('✓ Assets collected successfully!');
} catch (err) {
    console.error('Failed to copy assets:', err);
    process.exit(1);
}
