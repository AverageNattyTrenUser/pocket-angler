# 🎣 Pocket Angler

A cosy, offline fishing game for Android phones. Cast your line, wait for a bite, fight the fish, then spend your coins on better gear and new fishing spots.

**[⬇️ Download the latest APK](https://github.com/AverageNattyTrenUser/pocket-angler/releases/latest/download/PocketAngler.apk)**

## Install on your phone

1. Open the download link above on your Android phone.
2. Open the downloaded `PocketAngler.apk`.
3. If Android asks, allow your browser to **install unknown apps**, then tap **Install**.
4. Pocket Angler appears in your app drawer with its own icon. It works with no internet connection.

Updating: install a newer APK over the old one. Your progress is kept.

## How to play

| Step | What to do |
|---|---|
| **Cast** | Hold anywhere on the screen to charge, then let go. A longer cast reaches deeper water, where bigger and rarer fish live. |
| **Wait** | Small twitches are just nibbles. Tap only when the bobber is yanked under and the red **!** appears. |
| **Reel** | Hold to reel in. When the fish pulls (it splashes and a red **!** shows), let go so the line doesn't snap. Keep the tension bar out of the red. |
| **Upgrade** | Fish are sold automatically. Buy a better **rod** (faster reeling), **line** (stronger pull) and **bait** (faster bites, rarer fish). |
| **Explore** | Unlock 5 fishing spots: Willow Pond, Pebble River, Pine Lake, Sunny Coast and Frostbite Bay. |

There are **35 species** to discover (common to legendary), plus junk and the odd treasure chest. Some fish only bite at night. The in-game clock runs a full day every 6 minutes.

## How it's built

- The game itself is plain HTML5 Canvas + JavaScript in [`www/`](www/). Art and sound are drawn and synthesised in code, so there are no image or audio files. Even the app icon is drawn at build time by [`scripts/render-assets.js`](scripts/render-assets.js).
- [Capacitor](https://capacitorjs.com/) wraps it as a native Android app (with vibration, the back button and fullscreen).
- [GitHub Actions](.github/workflows/build-apk.yml) builds the APK on every push to `main` and publishes it as a new [release](../../releases).

### Make changes

```bash
npm install
npm run serve            # play in a desktop browser at http://localhost:8080
```

Push to `main` and a new APK appears under **Releases** in about 5 minutes. You can also re-run the build manually: **Actions → Build Android APK → Run workflow**.

To build locally (needs Android Studio / Android SDK and JDK 21):

```bash
npm run android:prepare
cd android && ./gradlew assembleDebug
```

`signing/debug.keystore.b64` is a throwaway debug key (stored as text and decoded at build time). Every build is signed with it, so new versions install over old ones. It's fine for personal installs, but don't use it to publish to the Play Store.
