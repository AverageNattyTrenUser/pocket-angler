#!/usr/bin/env bash
# Generates (if needed) and prepares the native Android project from the web game in www/.
set -euo pipefail
cd "$(dirname "$0")/.."

# Signing key is stored as text (base64) so the repo has no binary files
if [ ! -f signing/debug.keystore ]; then
  base64 -d signing/debug.keystore.b64 > signing/debug.keystore
fi

# App icon + splash screen, drawn with the game's own art code
node scripts/render-assets.js

if [ ! -d android ]; then
  npx cap add android
fi

npx @capacitor/assets generate --android \
  --iconBackgroundColor '#4fb3c8' --iconBackgroundColorDark '#14395a' \
  --splashBackgroundColor '#4fb3c8' --splashBackgroundColorDark '#0f2540'

node scripts/patch-android.js
npx cap sync android
