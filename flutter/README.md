# Yurist AI Flutter

Professional Flutter client for Yurist AI. The app is prepared for Android, iOS, and Web with BLoC and Clean Architecture style folders.

## Architecture

```text
lib/
  core/
    config/
    di/
    network/
    router/
    theme/
    widgets/
  features/
    auth/
      data/
      domain/
      presentation/
    chat/
      data/
      domain/
      presentation/
    profile/
      presentation/
```

## Features

- Login and register screens.
- User profile screen with avatar upload.
- Legal chat screen connected to the Yurist AI backend.
- Person type selector: individual/legal.
- Language selector: Uzbek Latin, Uzbek Cyrillic, Russian.
- Responsive Material 3 design.
- Logo asset included.

## Run

Start the Node backend first:

```bash
cd ../yurist_ai
npm start
```

Run Flutter web:

```bash
flutter run -d chrome --dart-define=API_BASE_URL=http://127.0.0.1:5050
```

Run Android emulator:

```bash
flutter run -d android --dart-define=API_BASE_URL=http://10.0.2.2:5050
```

Run iOS on macOS:

```bash
flutter run -d ios --dart-define=API_BASE_URL=http://127.0.0.1:5050
```

## Verified locally

```bash
flutter analyze
flutter test
flutter build web --release --dart-define=API_BASE_URL=http://127.0.0.1:5050
```

Android APK build can require a healthy local Gradle/Android cache. If Gradle reports corrupted `metadata.bin` under `C:\Users\Admin1\.gradle\caches`, stop Gradle daemons and regenerate the cache.

## IDX / Firebase Studio note

Project IDX is now Firebase Studio. As of June 22, 2026, new Firebase Studio workspace creation is disabled, and Firebase Studio is scheduled to sunset on March 22, 2027. This repo still includes `.idx/dev.nix` so it can be opened in an existing compatible workspace or migrated to Google's newer tools.
