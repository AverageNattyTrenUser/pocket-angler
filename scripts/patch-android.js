// Small tweaks applied to the generated Android project:
//  - lock the game to portrait
//  - stamp version code/name (from CI run number) so new builds install over old ones
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'android');

const manifestPath = path.join(root, 'app/src/main/AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('android:screenOrientation')) {
  manifest = manifest.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="portrait"');
}
fs.writeFileSync(manifestPath, manifest);

const gradlePath = path.join(root, 'app/build.gradle');
let gradle = fs.readFileSync(gradlePath, 'utf8');
const code = parseInt(process.env.VERSION_CODE || '1', 10);
const name = process.env.VERSION_NAME || '1.0';
gradle = gradle.replace(/versionCode \d+/, `versionCode ${code}`).replace(/versionName "[^"]*"/, `versionName "${name}"`);
// Sign every build with the same key (signing/debug.keystore) so updates install over the old app
if (!gradle.includes('pocketAnglerSigning')) {
  gradle = gradle.replace(/android\s*\{/, `android {
    // pocketAnglerSigning
    signingConfigs {
        debug {
            storeFile file("../../signing/debug.keystore")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }
    }`);
}
fs.writeFileSync(gradlePath, gradle);

console.log(`Patched Android project: portrait lock, version ${name} (${code})`);
