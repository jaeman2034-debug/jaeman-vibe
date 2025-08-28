@echo off
echo Starting Firebase Emulators...
echo.
echo This will start:
echo - Auth Emulator: http://127.0.0.1:9099
echo - Firestore Emulator: http://127.0.0.1:8080  
echo - Storage Emulator: http://127.0.0.1:9199
echo - Emulator UI: http://127.0.0.1:4000
echo.
echo Press Ctrl+C to stop
echo.

firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
