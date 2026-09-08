# AirMouse Cloud

> **Turn your phone into a wireless mouse & trackpad for your Windows laptop through the internet.**

AirMouse Cloud connects a mobile browser trackpad to your Windows PC over low-latency WebSockets. Zero mobile apps to install, zero mandatory user accounts, and zero simulated pointers—it directly controls the **real Windows OS cursor** via PyAutoGUI.

---

## How to Use AirMouse

### 1. Start the Receiver

Double-click:

```cmd
receiver/run_receiver.bat
```

*(or run `cd receiver && py receiver.py`)*

### 2. Get the PIN

The receiver displays a 6-digit pairing PIN.

### 3. Open AirMouse on Phone

Open the deployed AirMouse website in Chrome/Safari (or local `http://<your-laptop-ip>:5173`).

### 4. Enter PIN

Enter the 6-digit PIN shown on the laptop.

### 5. Connect

Tap **CONNECT**.

### 6. Control Laptop

Use the phone screen as a touchpad.
- **1-Finger Move**: Move Windows cursor
- **Single Tap**: Left Click
- **Double Tap**: Double Click
- **Two-Finger Tap**: Right Click
- **Two-Finger Drag**: Scroll Wheel
- **Long Press (>350ms) + Move**: Drag & Drop

### 7. Stop

Press:

```
[ STOP CONTROL ]
```

on the receiver whenever necessary (or press `Ctrl + C` in the console).

---

## System Architecture

```text
📱 Phone Mobile Browser (Safari, Chrome, Firefox)
          │
          │ HTTPS / WSS
          ▼
       ☁️ CLOUD WEBSOCKET RELAY (Node.js + ws)
    • Ephemeral 6-digit PIN verification
    • Rate limiting & single-use tokens
    • Coordinate safety clamping ([-300, 300])
    • Zero-latency message relay
          │
          │ Secure WSS
          ▼
💻 Windows AirMouse Receiver (Python + PyAutoGUI)
    • Floating always-on-top status window
    • Red [ STOP CONTROL ] emergency button
    • Auto-disconnect & button safety release
          │
          ▼
     Windows OS Cursor (REAL CURSOR)
```

---

## Receiver Configuration

Configure the cloud server URL in `receiver/config.json` or `receiver/.env`:

### Option A: `receiver/config.json`
```json
{
  "cloudWsUrl": "wss://your-airmouse-backend.onrender.com",
  "reconnectDelaySeconds": 3,
  "maxReconnectAttempts": 50
}
```

### Option B: `receiver/.env`
```env
CLOUD_WS_URL=wss://your-airmouse-backend.onrender.com
```

*For local testing, defaults to `ws://localhost:5000` automatically.*

---

## Standalone Windows Executable (.EXE)

You can compile a standalone `.exe` that runs without requiring Python installed:

1. Open the `receiver/` folder.
2. Double-click `build_exe.bat`.
3. PyInstaller compiles `dist/AirMouseReceiver.exe`.
4. Distribute or run `AirMouseReceiver.exe` on any Windows 10/11 machine!

---

## Development Setup

### 1. Install Dependencies
```powershell
npm run install:all
```

### 2. Start Cloud Relay Server
```powershell
npm run dev:server
# Server listens on port 5000 (ws://localhost:5000)
```

### 3. Start Frontend Client
```powershell
npm run dev:client
# Frontend runs at http://localhost:5173
```

### 4. Start Receiver
```powershell
py receiver/receiver.py
# Or run receiver/run_receiver.bat
```

---

## Running Automated Tests

Run the complete test suite across server and receiver:

```powershell
npm run test:all
```

- **Server tests** (`npm run test:server`): PIN generation, PIN expiration, invalid PIN rejection, single-use token consumption, rate limiting, and clamped gesture relay.
- **Receiver tests** (`npm run test:receiver`): PIN generation, URL validation, movement clamping, left click, right click, scroll, drag operations, peer disconnect handling, and emergency stop.
