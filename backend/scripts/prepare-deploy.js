const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Deployment Preparation for cPanel (Zero-Install/Tar Mode)...');

// Paths
const ROOT_DIR = process.cwd();
const STANDALONE_DIR = path.join(ROOT_DIR, '.next', 'standalone');
const STATIC_SRC = path.join(ROOT_DIR, '.next', 'static');
const PUBLIC_SRC = path.join(ROOT_DIR, 'public');
const STATIC_DEST = path.join(STANDALONE_DIR, '.next', 'static');
const PUBLIC_DEST = path.join(STANDALONE_DIR, 'public');

// 1. Check if Standalone exists
if (!fs.existsSync(STANDALONE_DIR)) {
    console.error('❌ Error: .next/standalone folder not found!');
    console.error('👉 Please run "npm run build" first.');
    process.exit(1);
}

// 2. Function to copy directories recursively
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// 3. Copy .next/static -> .next/standalone/.next/static
console.log('📂 Copying .next/static folder...');
if (fs.existsSync(STATIC_SRC)) {
    copyDir(STATIC_SRC, STATIC_DEST);
} else {
    console.warn('⚠️ Warning: .next/static folder not found. Skipping.');
}

// 4. Copy public -> .next/standalone/public
console.log('📂 Copying public folder...');
if (fs.existsSync(PUBLIC_SRC)) {
    copyDir(PUBLIC_SRC, PUBLIC_DEST);
} else {
    console.warn('⚠️ Warning: public folder not found. Skipping.');
}

// 4.5 Copy .npmrc (Vital for cPanel React 19 support)
console.log('📄 Copying .npmrc...');
const NPMRC_SRC = path.join(ROOT_DIR, '.npmrc');
const NPMRC_DEST = path.join(STANDALONE_DIR, '.npmrc');
if (fs.existsSync(NPMRC_SRC)) {
    fs.copyFileSync(NPMRC_SRC, NPMRC_DEST);
} else {
    // Create one if it doesn't exist
    fs.writeFileSync(NPMRC_DEST, 'legacy-peer-deps=true\n');
}

// 5. Create Tar file (INCLUDING node_modules for zero-install)
console.log('📦 Creating finsight-deploy-lite.tar.gz...');
const tarPath = path.join(ROOT_DIR, 'finsight-deploy-lite.tar.gz');

try {
    // Delete existing tar if any
    if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);

    // Using tar command specific for Windows (bsdtar) or Linux
    // -c: create, -z: gzip, -v: verbose, -f: file, -C: change dir
    const tarCommand = `tar -czvf "${tarPath}" -C "${STANDALONE_DIR}" .`;

    execSync(tarCommand, { stdio: 'inherit' });

    console.log(`\n✅ SUCCESS! Deployment Tar created at: ${tarPath}`);
    console.log(`👉 Upload "finsight-deploy-lite.tar.gz" to your cPanel "finsight-ai" folder.`);
    console.log(`👉 Extracting this will give you a READY-TO-RUN app (No npm install needed).`);
} catch (error) {
    console.error('❌ Error creating tar:', error.message);
}
