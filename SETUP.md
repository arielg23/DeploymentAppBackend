# Smart Lock App - Setup Guide

## Backend (Railway)

1. Create a Railway account at railway.app
2. Create new project → Deploy from GitHub repo (or connect this folder)
3. Add PostgreSQL plugin to the project
4. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (auto-set by PostgreSQL plugin)
   - `SECRET_KEY` = (generate with: python -c "import secrets; print(secrets.token_hex(32))")
   - `ADMIN_EMAIL` = admin@yourcompany.com
   - `ADMIN_PASSWORD` = (strong password)
5. Deploy - Alembic migrations run automatically on startup
6. Access admin at: https://your-app.up.railway.app/admin/

## Mobile App (Android APK)

### Prerequisites
- Node.js 22 LTS: https://nodejs.org
- JDK 17: https://adoptium.net
- Android SDK: https://developer.android.com/studio (install Android Studio)
- Set ANDROID_HOME env var

### Setup Steps

1. Edit `mobile/.env` → set `API_BASE_URL=https://your-app.up.railway.app`

2. Install dependencies:
   ```
   cd mobile
   npm install
   ```

3. Run React Native CLI init to generate Android native code:
   ```
   npx react-native init SmartLockInit --template react-native-template-typescript --skip-install
   cp -r SmartLockInit/android ./android
   cp SmartLockInit/index.js ./index.js
   rm -rf SmartLockInit
   ```

4. Configure android/app/src/main/AndroidManifest.xml:
   - Add: `<uses-permission android:name="android.permission.NFC" />`
   - Add: `<uses-permission android:name="android.permission.CAMERA" />`
   - Add: `<uses-permission android:name="android.permission.INTERNET" />`
   - Add NFC intent filter to main activity

5. Configure android/app/build.gradle:
   - Set minSdkVersion to 29 (Android 10)
   - Apply react-native-config plugin

6. Generate signing keystore:
   ```
   keytool -genkey -v -keystore android/app/smartlock.keystore \
     -alias smartlock -keyalg RSA -keysize 2048 -validity 10000
   ```

7. Add to android/gradle.properties:
   ```
   MYAPP_RELEASE_STORE_FILE=smartlock.keystore
   MYAPP_RELEASE_KEY_ALIAS=smartlock
   MYAPP_RELEASE_STORE_PASSWORD=your_store_password
   MYAPP_RELEASE_KEY_PASSWORD=your_key_password
   ```

8. Build release APK:
   ```
   cd android
   ./gradlew assembleRelease
   ```
   APK: android/app/build/outputs/apk/release/app-release.apk

9. Install on device:
   - Enable "Install from Unknown Sources" in Android Settings
   - Transfer APK via USB and install
   - Connect device to same WiFi as backend (or use Railway URL)

## Local Development (Optional)

To run backend locally with Docker:
```
docker run -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=smartlock -p 5432:5432 -d postgres:16-alpine
cd app
pip install -r requirements.txt
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/smartlock alembic upgrade head
uvicorn main:app --reload
```
