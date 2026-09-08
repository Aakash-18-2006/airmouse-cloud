# Windows AirMouse Receiver Guide

The **AirMouse Receiver** is a lightweight Python program that runs on your Windows laptop. It translates validated touch gestures sent from your phone into **real Windows OS cursor movements and clicks**.

---

## 1. Quick Start

### Method A: Double-Click Batch File (Simplest)
Navigate into the `receiver/` folder and double-click:
```bat
run_receiver.bat
```
This launcher checks if Python is available, installs required packages (`pyautogui`, `websocket-client`) if missing, and immediately runs `receiver.py`.

### Method B: Command Prompt / PowerShell
```powershell
cd "receiver"
py -m pip install -r requirements.txt
py receiver.py
```

---

## 2. Console Output & Pairing Flow

When started, the receiver displays:

```text
========================================
           AIR MOUSE CLOUD              
========================================
Cloud:       [CONNECTED]
Phone:       [WAITING FOR PHONE]

Laptop:      DESKTOP-XXXXX
Controls:    Mouse: STOPPED / INACTIVE
----------------------------------------

Pairing Code:
      >> [ 482731 ] <<

Open: https://airmouse.app (or mobile client)
Waiting for phone to enter code...
----------------------------------------
Controls: Type 'stop' or press Ctrl+C for Emergency Stop
========================================
```

1. Open your mobile phone browser to the AirMouse URL.
2. Enter the 6-digit code (e.g. `482731`).
3. The receiver will immediately switch to:
   ```text
   Cloud:       [CONNECTED]
   Phone:       [CONNECTED]
   Controls:    Mouse: ENABLED
   ```
4. Touch or swipe your phone screen: your real Windows cursor will move with zero noticeable lag!

---

## 3. Emergency Stop Features

AirMouse includes 3 redundant emergency stop fail-safes:

1. **Floating Emergency Button**:
   - The receiver launches a compact top-most status window with a bright red **`🛑 STOP CONTROL`** button. Clicking it instantly severs mouse control and releases any held buttons.
2. **Terminal Hotkey**:
   - Pressing `Ctrl + C` or typing `stop` in the console immediately stops control and exits cleanly.
3. **Auto Disengage**:
   - If the phone browser tab is closed or your internet drops, the receiver detects socket termination and immediately disables mouse input.

---

## 4. Packaging into a Standalone `.EXE`

To distribute the receiver to users who don't have Python installed:

1. In the `receiver/` folder, run:
   ```bat
   build_exe.bat
   ```
2. PyInstaller packages Python, PyAutoGUI, and dependencies into a single binary:
   ```text
   receiver\dist\AirMouseReceiver.exe
   ```
3. Users can copy and run `AirMouseReceiver.exe` on any Windows 10/11 laptop directly!

---

## 5. Troubleshooting & FAQ

- **Cursor moves too fast / slow**: Adjust the sensitivity slider on your phone trackpad screen (from 0.4x to 3.5x).
- **Windows Defender / SmartScreen warning**: Unsigned standalone executables may trigger a Windows SmartScreen warning. Click "More Info" -> "Run Anyway".
- **Multi-monitor setups**: PyAutoGUI automatically spans across your primary and secondary monitors seamlessly.
