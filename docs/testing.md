# AirMouse Cloud - Testing Documentation

This document outlines the automated and integration testing suites built for AirMouse Cloud.

---

## 1. Automated Test Suites

### 1.1 Backend Unit & Integration Tests (Jest + Supertest + ws)
Located in `server/tests/`:
- **`sessionManager.test.ts`**:
  - Validates 6-digit code generation conforming to `/^\d{6}$/`.
  - Tests phone pairing and cryptographic session token generation (64-character hex string).
  - Tests single-use code consumption (verifies expired/consumed codes cannot be reused).
  - Tests rate-limiting against brute force attacks (>10 rapid attempts from same IP are blocked).
  - Tests emergency stop cleanup (token invalidation and session termination).
- **`wsProtocol.test.ts`**:
  - Spins up a real HTTP + WebSocket server on a free port.
  - Registers a simulated Windows receiver.
  - Connects a simulated phone client with the returned pairing code.
  - Sends intentional out-of-bounds `dx: 99999` and `dy: -88888` coordinates.
  - Verifies server clamps deltas to `300` and `-300` before relaying.
  - Tests rejection of unauthorized clients without valid session tokens.

Run server tests:
```powershell
npm run test:server
```

---

### 1.2 Receiver Unit Tests (Python unittest)
Located in `receiver/tests/test_protocol.py`:
- `test_move_command_normal`: Verifies delta translation to `pyautogui.moveRel(dx, dy, _pause=False)`.
- `test_move_command_clamped`: Tests coordinate safety clamping on receiver side.
- `test_left_click_command`: Verifies left-click dispatch.
- `test_right_click_command`: Verifies right-click dispatch.
- `test_double_click_command`: Verifies double-click dispatch.
- `test_scroll_command`: Verifies vertical mouse wheel scrolling.
- `test_emergency_stop_disables_control`: Verifies button safety release and state decoupling.
- `test_ignores_commands_when_control_disabled`: Ensures no commands execute after emergency stop.

Run receiver tests:
```powershell
npm run test:receiver
```
Or directly:
```powershell
py -m unittest discover -s receiver/tests
```

---

### 1.3 Full-Project Automated Test Runner
```powershell
npm run test:all
```

---

## 2. Physical Device Testing Notice

> [!NOTE]
> While backend protocols, session lifecycle, rate limiting, bounds clamping, frame coalescing, and PyAutoGUI dispatch have been automated and tested in this environment:
> 
> **“Physical device testing required.”**
> 
> To test real-world physical trackpad feel:
> 1. Launch `npm run dev:server` on laptop.
> 2. Run `py receiver/receiver.py` on the laptop.
> 3. Open the web interface on an actual Android smartphone or iPhone connected to the same Wi-Fi network or public domain.
> 4. Enter the 6-digit code on the phone screen and swipe your finger to feel physical OS cursor tracking across your laptop monitor.
