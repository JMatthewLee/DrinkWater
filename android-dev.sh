#!/bin/bash

# Android Development Helper Script for DrinkWater App
# This script provides quick commands for Android development and testing

echo "🚀 DrinkWater Android Development Helper"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to display help
show_help() {
    echo ""
    echo "Available commands:"
    echo "  setup     - Initial setup and dependency installation"
    echo "  dev       - Start local development server"
    echo "  build     - Build preview APK for testing"
    echo "  build-dev - Build development client"
    echo "  build-prod- Build production AAB"
    echo "  install   - Install APK on connected device"
    echo "  test      - Run testing checklist"
    echo "  clean     - Clean build cache and node_modules"
    echo "  help      - Show this help message"
    echo ""
}

# Function for initial setup
setup() {
    echo "🔧 Setting up Android development environment..."
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Check if EAS is configured
    if [ ! -f "eas.json" ]; then
        echo "⚙️  Configuring EAS..."
        npx eas build:configure
    fi
    
    # Check if Android device is connected
    if adb devices | grep -q "device$"; then
        echo "✅ Android device detected"
    else
        echo "⚠️  No Android device detected. Connect device and enable USB debugging."
    fi
    
    echo "✅ Setup complete!"
}

# Function to start development
dev() {
    echo "🚀 Starting development server..."
    npm run android:dev
}

# Function to build preview APK
build() {
    echo "🔨 Building preview APK..."
    npm run android:build
    echo "✅ Build started! Check EAS dashboard for progress."
}

# Function to build development client
build_dev() {
    echo "🔨 Building development client..."
    npm run android:build-dev
    echo "✅ Development build started! Check EAS dashboard for progress."
}

# Function to build production AAB
build_prod() {
    echo "🔨 Building production AAB..."
    npm run android:build-prod
    echo "✅ Production build started! Check EAS dashboard for progress."
}

# Function to install APK
install() {
    echo "📱 Installing APK on device..."
    if adb devices | grep -q "device$"; then
        echo "Please provide the path to the APK file:"
        read apk_path
        if [ -f "$apk_path" ]; then
            adb install "$apk_path"
            echo "✅ APK installed successfully!"
        else
            echo "❌ APK file not found: $apk_path"
        fi
    else
        echo "❌ No Android device connected"
    fi
}

# Function to run testing checklist
test() {
    echo "🧪 Android Testing Checklist"
    echo "=========================="
    echo ""
    echo "Pre-Build Testing:"
    echo "□ App builds successfully with 'npm run android:build'"
    echo "□ APK downloads from EAS dashboard"
    echo "□ APK installs on Android device"
    echo ""
    echo "BLE Functionality Testing:"
    echo "□ App requests Bluetooth permissions on first launch"
    echo "□ Permission dialog shows clear explanation"
    echo "□ Can scan for ESP32 water tracking device"
    echo "□ Can connect to ESP32 device"
    echo "□ Receives water consumption notifications from ESP32"
    echo "□ Can send commands to ESP32 (if implemented)"
    echo "□ BLE connection persists when app goes to background"
    echo "□ Reconnection works after app restart"
    echo "□ Error handling works for denied permissions"
    echo ""
    echo "Device Compatibility Testing:"
    echo "□ Test on Android 12+ (API 31+) - new Bluetooth permissions"
    echo "□ Test on Android 11 and below - legacy permissions"
    echo "□ Test on different manufacturers (Samsung, Google, OnePlus, etc.)"
    echo "□ Test on tablets (if supported)"
    echo ""
    echo "📖 See ANDROID_DEVELOPMENT.md for detailed testing instructions"
}

# Function to clean build cache
clean() {
    echo "🧹 Cleaning build cache and dependencies..."
    rm -rf node_modules
    npm install
    npx expo start --clear
    echo "✅ Clean complete!"
}

# Main script logic
case "$1" in
    setup)
        setup
        ;;
    dev)
        dev
        ;;
    build)
        build
        ;;
    build-dev)
        build_dev
        ;;
    build-prod)
        build_prod
        ;;
    install)
        install
        ;;
    test)
        test
        ;;
    clean)
        clean
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_help
        ;;
esac
