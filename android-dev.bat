@echo off
REM Android Development Helper Script for DrinkWater App
REM This script provides quick commands for Android development and testing

echo 🚀 DrinkWater Android Development Helper
echo ========================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

if "%1"=="" goto :help
if "%1"=="help" goto :help
if "%1"=="--help" goto :help
if "%1"=="-h" goto :help

if "%1"=="setup" goto :setup
if "%1"=="dev" goto :dev
if "%1"=="build" goto :build
if "%1"=="build-dev" goto :build-dev
if "%1"=="build-prod" goto :build-prod
if "%1"=="install" goto :install
if "%1"=="test" goto :test
if "%1"=="clean" goto :clean

echo ❌ Unknown command: %1
goto :help

:help
echo.
echo Available commands:
echo   setup     - Initial setup and dependency installation
echo   dev       - Start local development server
echo   build     - Build preview APK for testing
echo   build-dev - Build development client
echo   build-prod- Build production AAB
echo   install   - Install APK on connected device
echo   test      - Run testing checklist
echo   clean     - Clean build cache and node_modules
echo   help      - Show this help message
echo.
pause
exit /b 0

:setup
echo 🔧 Setting up Android development environment...
echo 📦 Installing dependencies...
call npm install

REM Check if EAS is configured
if not exist "eas.json" (
    echo ⚙️  Configuring EAS...
    call npx eas build:configure
)

REM Check if Android device is connected
adb devices | findstr "device" >nul
if %errorlevel%==0 (
    echo ✅ Android device detected
) else (
    echo ⚠️  No Android device detected. Connect device and enable USB debugging.
)

echo ✅ Setup complete!
pause
exit /b 0

:dev
echo 🚀 Starting development server...
call npm run android:dev
pause
exit /b 0

:build
echo 🔨 Building preview APK...
call npm run android:build
echo ✅ Build started! Check EAS dashboard for progress.
pause
exit /b 0

:build-dev
echo 🔨 Building development client...
call npm run android:build-dev
echo ✅ Development build started! Check EAS dashboard for progress.
pause
exit /b 0

:build-prod
echo 🔨 Building production AAB...
call npm run android:build-prod
echo ✅ Production build started! Check EAS dashboard for progress.
pause
exit /b 0

:install
echo 📱 Installing APK on device...
adb devices | findstr "device" >nul
if %errorlevel%==0 (
    echo Please provide the path to the APK file:
    set /p apk_path=
    if exist "%apk_path%" (
        adb install "%apk_path%"
        echo ✅ APK installed successfully!
    ) else (
        echo ❌ APK file not found: %apk_path%
    )
) else (
    echo ❌ No Android device connected
)
pause
exit /b 0

:test
echo 🧪 Android Testing Checklist
echo ==========================
echo.
echo Pre-Build Testing:
echo □ App builds successfully with 'npm run android:build'
echo □ APK downloads from EAS dashboard
echo □ APK installs on Android device
echo.
echo BLE Functionality Testing:
echo □ App requests Bluetooth permissions on first launch
echo □ Permission dialog shows clear explanation
echo □ Can scan for ESP32 water tracking device
echo □ Can connect to ESP32 device
echo □ Receives water consumption notifications from ESP32
echo □ Can send commands to ESP32 (if implemented)
echo □ BLE connection persists when app goes to background
echo □ Reconnection works after app restart
echo □ Error handling works for denied permissions
echo.
echo Device Compatibility Testing:
echo □ Test on Android 12+ (API 31+) - new Bluetooth permissions
echo □ Test on Android 11 and below - legacy permissions
echo □ Test on different manufacturers (Samsung, Google, OnePlus, etc.)
echo □ Test on tablets (if supported)
echo.
echo 📖 See ANDROID_DEVELOPMENT.md for detailed testing instructions
pause
exit /b 0

:clean
echo 🧹 Cleaning build cache and dependencies...
if exist "node_modules" rmdir /s /q "node_modules"
call npm install
call npx expo start --clear
echo ✅ Clean complete!
pause
exit /b 0
