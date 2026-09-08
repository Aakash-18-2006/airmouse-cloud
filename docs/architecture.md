# AirMouse Cloud - Architecture Documentation

## 1. System Overview

AirMouse Cloud is a zero-install cloud trackpad system enabling any mobile smartphone to control the real Windows cursor on a laptop across the internet without requiring Bluetooth pairing or shared local Wi-Fi.

```text
📱 Mobile Phone (Web Browser)
        │
        │ HTTPS / WSS (Secure WebSocket)
        ▼
     ☁️ CLOUD RELAY SERVER (Node.js + Express + ws)
  ┌──────────────────────────────────────────────┐
  │  • Pairing Manager (TTL 10m, Rate Limited)   │
  │  • Cryptographic 6-digit Code Generator      │
  │  • Session Token Authority (SHA-256 / hex)   │
  │  • Command Validator & Boundary Clamper      │
  │  • Instant Emergency Stop Decoupler          │
  └──────────────────────┬───────────────────────┘
                         │
                         │ WSS (Encrypted token auth)
                         ▼
           💻 WINDOWS AIRMOUSE RECEIVER (Python)
  ┌──────────────────────────────────────────────┐
  │  • WebSocket Persistent Connection           │
  │  • Real-time PyAutoGUI Driver (PAUSE = 0.0)  │
  │  • Screen Bounds Clamping & Monitor Bounds   │
  │  • Floating Status & Emergency Stop Overlay  │
  └──────────────────────┬───────────────────────┘
                         │
                         ▼
                   🖱️ WINDOWS OS
              (Real Cursor / SendInput)
```

---

## 2. Component Roles

### 2.1 Mobile Phone (Client)
- **Technology**: React 18, TypeScript, Vite, Vanilla CSS design tokens.
- **Role**:
  - Full-screen multi-touch trackpad surface with `touch-action: none`.
  - Client-side gesture engine for:
    - 1-finger move (relative delta tracking with customizable sensitivity curves).
    - Single tap -> Left Click.
    - Double tap -> Double Click.
    - 2-finger tap -> Right Click.
    - 2-finger drag -> Scroll wheel event.
    - Long press (>350ms) -> Drag & Drop (Mouse Down, Move, Mouse Up).
  - Micro-buffering & frame coalescing: combines sub-pixel movements within `requestAnimationFrame` (~16ms) to prevent network saturation while maintaining a fluid 60fps tracking experience.
  - Haptic feedback via `navigator.vibrate`.

### 2.2 Cloud Relay Server
- **Technology**: Node.js, Express, TypeScript, `ws`.
- **Role**:
  - Coordinates zero-account pairing sessions using cryptographically secure 6-digit random codes.
  - Enforces rate-limiting: maximum 5 failed pairing attempts per IP every 5 minutes to prevent brute-force attacks.
  - Generates single-use 64-character session tokens upon pairing.
  - Validates and sanitizes every incoming mouse packet:
    - Verifies session token authenticity.
    - Clamps `dx` and `dy` to `[-300, 300]`.
    - Clamps scroll amount to `[-100, 100]`.
    - Whitelists command types.
  - Delivers packets with sub-15ms relay latency directly between paired sockets.

### 2.3 Windows AirMouse Receiver
- **Technology**: Python 3.11+, PyAutoGUI, WebSocket-Client, Tkinter.
- **Role**:
  - Connects to the cloud server, registers the laptop's hostname, and obtains the active 6-digit pairing code.
  - Configures `pyautogui.PAUSE = 0.0` to eliminate artificial framework latency.
  - Executes real OS cursor movements and clicks via Windows input hooks.
  - Enforces safety:
    - Floating Emergency Stop overlay window.
    - Console hotkey: `Ctrl + C` or typing `stop`.
    - Auto-disengages cursor control immediately if WebSocket or phone disconnects.

---

## 3. Protocol Specification

### Inbound to Server
| Type | Sender | Payload | Description |
|---|---|---|---|
| `register_receiver` | Receiver | `{ hostname: string }` | Requests new 6-digit pairing session |
| `pair_with_code` | Phone | `{ code: string }` | Phone submits 6-digit code |
| `mouse_event` | Phone | `{ sessionToken: string, payload: MouseEventPayload }` | Dispatches validated mouse command |
| `emergency_stop` | Either | `{}` | Immediately halts and terminates session |
| `ping` | Either | `{}` | Heartbeat check |

### Outbound from Server
| Type | Recipient | Payload | Description |
|---|---|---|---|
| `pairing_code` | Receiver | `{ code: string, expiresInSeconds: number }` | Informs receiver of assigned code |
| `pairing_success` | Both | `{ sessionToken: string, hostname: string }` | Notifies pairing success & issues token |
| `pairing_failed` | Phone | `{ message: string }` | Rejection details |
| `mouse_relay` | Receiver | `{ payload: MouseEventPayload }` | Clamped & validated OS command |
| `peer_disconnected`| Both | `{ message: string }` | Informs when opposite peer drops |
| `emergency_stopped`| Both | `{ message: string }` | Informs of emergency halt |

---

## 4. Security Considerations
1. **No Accounts Needed**: Sessions are strictly ephemeral with a 10-minute code TTL.
2. **Rate Limiting**: Brute forcing 6-digit codes is prevented by exponential backoff and IP-based rate limiting.
3. **No Arbitrary OS Commands**: The protocol exclusively accepts whitelist-validated mouse events (`move`, `left_click`, `right_click`, `double_click`, `mouse_down`, `mouse_up`, `scroll`). No shell, keyboard keystroke, or file execution logic exists.
4. **Boundary Clamping**: Prevents rogue clients from sending extreme coordinate deltas.
