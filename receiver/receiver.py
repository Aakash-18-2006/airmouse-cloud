"""
AirMouse Cloud - Windows Receiver
Connects to Cloud WebSocket Server and translates validated phone gestures to real OS cursor movements.
Fully controls the real Windows cursor via PyAutoGUI.
"""
import sys
import os
import time
import json
import socket
import secrets
import argparse
import threading
import pyautogui
import websocket

# Ensure Windows console supports utf-8 safely
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import webbrowser
import ctypes
from ctypes import wintypes

# Local imports
try:
    from config import (
        DEFAULT_SERVER_URL,
        DEFAULT_WEBSITE_URL,
        RECONNECT_DELAY_SECONDS,
        MAX_RECONNECT_ATTEMPTS,
        PYAUTOGUI_PAUSE,
        PYAUTOGUI_FAILSAFE,
        MAX_DELTA,
        MAX_SCROLL,
        validate_ws_url
    )
except ImportError:
    from .config import (
        DEFAULT_SERVER_URL,
        DEFAULT_WEBSITE_URL,
        RECONNECT_DELAY_SECONDS,
        MAX_RECONNECT_ATTEMPTS,
        PYAUTOGUI_PAUSE,
        PYAUTOGUI_FAILSAFE,
        MAX_DELTA,
        MAX_SCROLL,
        validate_ws_url
    )

# Configure PyAutoGUI for ultra-low latency cursor response
pyautogui.PAUSE = PYAUTOGUI_PAUSE
pyautogui.FAILSAFE = PYAUTOGUI_FAILSAFE

ALLOWED_RECEIVER_KEYS = {
    # Letters A-Z
    *(chr(c) for c in range(ord('a'), ord('z') + 1)),
    # Numbers 0-9
    *(str(i) for i in range(10)),
    # Function keys F1-F12
    *(f'f{i}' for i in range(1, 13)),
    # Navigation & control keys
    'space', 'enter', 'backspace', 'tab', 'esc', 'escape',
    'up', 'down', 'left', 'right',
    'shift', 'ctrl', 'alt',
    'delete', 'home', 'end', 'pageup', 'pagedown'
}

ALLOWED_RECEIVER_MODIFIERS = {'ctrl', 'shift', 'alt'}

def find_airmouse_windows():
    """
    Finds open top-level Windows whose title contains 'AirMouse' or 'Air Mouse' or 'airmouse-cloud'.
    Excludes the receiver's own console or floating GUI window.
    Returns list of tuples: (hwnd, title)
    """
    if os.name != 'nt':
        return []

    user32 = ctypes.windll.user32
    matches = []
    current_pid = os.getpid()

    WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

    def enum_cb(hwnd, lparam):
        try:
            if not user32.IsWindow(hwnd) or not user32.IsWindowVisible(hwnd):
                return True

            # Exclude the receiver process itself
            lpdw_process_id = wintypes.DWORD()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(lpdw_process_id))
            if lpdw_process_id.value == current_pid:
                return True

            length = user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buff = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buff, length + 1)
                title = buff.value
                t_lower = title.lower()
                # Match AirMouse website windows and ignore receiver window
                if ("airmouse" in t_lower or "air mouse" in t_lower) and "receiver" not in t_lower:
                    matches.append((hwnd, title))
        except Exception:
            pass
        return True

    user32.EnumWindows(WNDENUMPROC(enum_cb), 0)
    return matches

def bring_window_to_foreground(hwnd):
    """
    Restores (if minimized) and brings the specified window to the foreground.
    Uses Win32 AttachThreadInput to reliably switch focus from background.
    """
    if os.name != 'nt' or not hwnd:
        return

    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32

    try:
        # If minimized, restore it: SW_RESTORE = 9, SW_SHOW = 5
        SW_RESTORE = 9
        SW_SHOW = 5
        if user32.IsIconic(hwnd):
            user32.ShowWindow(hwnd, SW_RESTORE)
        else:
            user32.ShowWindow(hwnd, SW_SHOW)

        # Attach thread input of foreground window to current thread to bypass Windows focus lock
        cur_thread = kernel32.GetCurrentThreadId()
        fg_hwnd = user32.GetForegroundWindow()
        fg_thread = user32.GetWindowThreadProcessId(fg_hwnd, None) if fg_hwnd else 0

        if fg_thread != 0 and fg_thread != cur_thread:
            user32.AttachThreadInput(cur_thread, fg_thread, True)

        user32.SetForegroundWindow(hwnd)
        user32.BringWindowToTop(hwnd)
        user32.SetFocus(hwnd)

        if fg_thread != 0 and fg_thread != cur_thread:
            user32.AttachThreadInput(cur_thread, fg_thread, False)
    except Exception:
        # Fallback to PyGetWindow if available
        try:
            import pygetwindow as gw
            for w in gw.getAllWindows():
                if ("airmouse" in w.title.lower() or "air mouse" in w.title.lower()) and "receiver" not in w.title.lower():
                    if w.isMinimized:
                        w.restore()
                    w.activate()
                    break
        except Exception:
            pass

def manage_windows_startup(install: bool) -> bool:
    """Configures AirMouse Receiver to run automatically on Windows startup."""
    if os.name != 'nt':
        print("Windows startup management is only supported on Windows.")
        return False

    import winreg
    key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
    app_name = "AirMouseReceiver"

    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
        if install:
            if getattr(sys, 'frozen', False):
                cmd = f'"{sys.executable}"'
            else:
                py_exe = sys.executable.replace("python.exe", "pythonw.exe")
                if not os.path.exists(py_exe):
                    py_exe = sys.executable
                script_path = os.path.abspath(__file__)
                cmd = f'"{py_exe}" "{script_path}"'

            winreg.SetValueEx(key, app_name, 0, winreg.REG_SZ, cmd)
            winreg.CloseKey(key)
            print(f"✓ AirMouse Receiver successfully added to Windows Startup:\n  {cmd}")
            return True
        else:
            try:
                winreg.DeleteValue(key, app_name)
                print("✓ AirMouse Receiver removed from Windows Startup.")
            except FileNotFoundError:
                print("AirMouse Receiver was not found in Windows Startup.")
            winreg.CloseKey(key)
            return True
    except Exception as e:
        print(f"❌ Failed to update Windows Startup registry: {e}")
        return False

class AirMouseReceiver:
    def __init__(self, server_url=DEFAULT_SERVER_URL, website_url=DEFAULT_WEBSITE_URL, enable_gui=True):
        self.server_url = server_url.strip() if server_url else ""
        self.website_url = website_url.strip() if website_url else DEFAULT_WEBSITE_URL
        self.enable_gui = enable_gui
        self.hostname = socket.gethostname()
        self.ws = None
        self.is_running = False
        self.control_enabled = False
        self.pairing_code = "------"
        self.cloud_status = "DISCONNECTED" # CONNECTING | CONNECTED | DISCONNECTED | RECONNECTING
        self.phone_connected = False
        self.session_token = None
        self.gui_overlay = None
        self.held_keys = set()
        self._lock = threading.Lock()
        self._stopped_by_user = False
        self._last_hotkey_trigger = 0.0

    def generate_secure_pin(self) -> str:
        """Generates a cryptographically random 6-digit PIN."""
        return f"{secrets.randbelow(900000) + 100000:06d}"

    def print_status(self):
        """Displays formatted terminal banner matching specifications."""
        cloud_str = f"[{self.cloud_status}]"
        phone_str = "[CONNECTED]" if self.phone_connected else ("[WAITING FOR PHONE]" if self.cloud_status == "CONNECTED" else "[DISCONNECTED]")
        control_str = "ACTIVE" if self.control_enabled else ("CONTROL STOPPED" if self._stopped_by_user else "INACTIVE")

        os.system('cls' if os.name == 'nt' else 'clear')
        print("========================================")
        print("           AIR MOUSE CLOUD              ")
        print("========================================")
        print(f"Cloud Status: {cloud_str}")
        print(f"Phone:        {phone_str}")
        print(f"Control:      {control_str}")
        print(f"Laptop:       {self.hostname}")
        print("----------------------------------------")
        if not self.phone_connected and self.cloud_status == "CONNECTED":
            print("\nPAIRING CODE:")
            print(f"      >> [ {self.pairing_code} ] <<\n")
            print("Waiting for phone to enter PIN on web client...")
        elif self.phone_connected:
            print("\nSession:      Active & Linked")
            print("Action:       Controlling Real Windows Cursor [PyAutoGUI]")
        print("----------------------------------------")
        print("Shortcut: Press Ctrl+A+H to open/focus website")
        print("Controls: Type 'stop' or press Ctrl+C for Emergency Stop")
        print("========================================")

    def launch_or_focus_airmouse(self):
        """
        Triggered when Ctrl + A + H is pressed.
        1. Checks if Air Mouse website is already open.
        2. If open: restores and brings existing window to the foreground without opening duplicate tabs.
        3. If not open: opens the deployed Air Mouse website in the default browser.
        """
        now = time.time()
        with self._lock:
            if now - self._last_hotkey_trigger < 1.0:
                return
            self._last_hotkey_trigger = now

        print("\n[HOTKEY] Ctrl+A+H detected")
        try:
            windows = find_airmouse_windows()
            if windows:
                hwnd, title = windows[0]
                print(f"[HOTKEY] Air Mouse website already open - focusing window")
                bring_window_to_foreground(hwnd)
            else:
                print("[HOTKEY] Opening Air Mouse website")
                target_url = self.website_url
                if self.pairing_code and self.pairing_code != "------":
                    target_url = f"{self.website_url}/connect?code={self.pairing_code}"
                webbrowser.open(target_url)
        except Exception as e:
            print(f"[HOTKEY] Error launching or focusing website: {e}")
            try:
                webbrowser.open(self.website_url)
            except Exception:
                pass

    def start_global_hotkey_listener(self):
        """
        Registers the global Windows shortcut: Ctrl + A + H.
        Specifically requires Ctrl key + letter 'A' + letter 'H' (NOT Alt).
        Uses keyboard library with ctypes GetAsyncKeyState polling fallback.
        Does not block normal keyboard input.
        """
        # 1. Register with keyboard library if available
        try:
            import keyboard
            keyboard.add_hotkey('ctrl+a+h', self.launch_or_focus_airmouse, suppress=False)
        except Exception:
            pass

        # 2. Start background thread polling GetAsyncKeyState as universal fallback
        if os.name == 'nt':
            def _poll_keys():
                user32 = ctypes.windll.user32
                VK_CONTROL = 0x11
                VK_A = 0x41
                VK_H = 0x48
                VK_MENU = 0x12  # Alt key

                is_active = False

                while self.is_running:
                    try:
                        ctrl_down = bool(user32.GetAsyncKeyState(VK_CONTROL) & 0x8000)
                        a_down = bool(user32.GetAsyncKeyState(VK_A) & 0x8000)
                        h_down = bool(user32.GetAsyncKeyState(VK_H) & 0x8000)
                        alt_down = bool(user32.GetAsyncKeyState(VK_MENU) & 0x8000)

                        # Must specifically be Ctrl + A + H, and NOT Alt
                        combo_down = ctrl_down and a_down and h_down and not alt_down

                        if combo_down and not is_active:
                            is_active = True
                            threading.Thread(target=self.launch_or_focus_airmouse, daemon=True).start()
                        elif not combo_down and is_active:
                            is_active = False
                    except Exception:
                        pass

                    time.sleep(0.04)

            t = threading.Thread(target=_poll_keys, daemon=True)
            t.start()

    def emergency_stop(self):
        """
        Emergency stop immediately halts mouse control, releases buttons,
        and invalidates active session.
        """
        with self._lock:
            self.control_enabled = False
            self.phone_connected = False
            self._stopped_by_user = True

        # Release any pressed mouse buttons safely
        try:
            pyautogui.mouseUp(button='left', _pause=False)
            pyautogui.mouseUp(button='right', _pause=False)
        except Exception:
            pass

        # Release any held keyboard keys & modifiers safely
        with self._lock:
            held = list(self.held_keys)
            self.held_keys.clear()
        for k in held:
            try:
                pyautogui.keyUp(k, _pause=False)
            except Exception:
                pass
        for mod in ('shift', 'ctrl', 'alt'):
            try:
                pyautogui.keyUp(mod, _pause=False)
            except Exception:
                pass

        # Send emergency stop packet to server relay
        if self.ws and self.ws.sock and self.ws.sock.connected:
            try:
                self.ws.send(json.dumps({"type": "emergency_stop"}))
            except Exception:
                pass

        if self.gui_overlay:
            self.gui_overlay.show_stopped_state()

        self.print_status()
        print("\n🛑 [EMERGENCY STOP TRIGGERED] Mouse control immediately disabled.")

    def handle_command(self, payload):
        """Dispatches validated commands directly to Windows OS input."""
        if not self.control_enabled:
            return

        cmd_raw = payload.get("type")
        if not cmd_raw:
            return

        cmd_type = str(cmd_raw).lower()

        try:
            # 1. Relative Mouse Movement
            if cmd_type in ("move", "drag_move"):
                dx = int(payload.get("dx", 0))
                dy = int(payload.get("dy", 0))

                # Clamping bounds to safe limits
                dx = max(-MAX_DELTA, min(MAX_DELTA, dx))
                dy = max(-MAX_DELTA, min(MAX_DELTA, dy))

                if dx != 0 or dy != 0:
                    pyautogui.moveRel(dx, dy, _pause=False)

            # 2. Single Tap -> Left Click
            elif cmd_type == "left_click":
                pyautogui.click(button="left", _pause=False)

            # 3. Two-Finger Tap -> Right Click
            elif cmd_type == "right_click":
                pyautogui.click(button="right", _pause=False)

            # 4. Double Tap -> Double Click
            elif cmd_type == "double_click":
                pyautogui.doubleClick(_pause=False)

            # 5. Long Press / Drag Start -> Mouse Down
            elif cmd_type in ("drag_start", "mouse_down"):
                btn = "right" if payload.get("button") == "right" else "left"
                pyautogui.mouseDown(button=btn, _pause=False)

            # 6. Drag End -> Mouse Up
            elif cmd_type in ("drag_end", "mouse_up"):
                btn = "right" if payload.get("button") == "right" else "left"
                pyautogui.mouseUp(button=btn, _pause=False)

            # 7. Two-Finger Vertical Movement -> Scroll
            elif cmd_type == "scroll":
                amount = int(payload.get("amount", 0))
                amount = max(-MAX_SCROLL, min(MAX_SCROLL, amount))
                if amount != 0:
                    pyautogui.scroll(amount, _pause=False)

            # 8. Emergency Stop
            elif cmd_type in ("stop", "emergency_stop"):
                self.emergency_stop()

            # 9. Alt + F4 Window Close Shortcut
            elif cmd_type in ("alt_f4", "alt+f4", "alt_f4_press"):
                print("⚡ [ALT_F4] Received Alt+F4 command from Air Mouse")
                try:
                    pyautogui.hotkey("alt", "f4")
                    print("✓ [ALT_F4] Executed pyautogui.hotkey('alt', 'f4') successfully.")
                except Exception as e:
                    print(f"❌ [ALT_F4] Error executing Alt+F4 shortcut: {e}")

        except Exception:
            # Prevent receiver from crashing on any unexpected input hiccup
            pass

    def handle_keyboard_command(self, payload):
        """
        Dispatches validated keyboard commands via PyAutoGUI.
        Whitelists all keys and modifiers to prevent arbitrary shell/OS command execution.
        Never logs or stores sensitive keyboard content.
        """
        if not self.control_enabled or not payload:
            return

        action = str(payload.get("action", "")).lower().strip()
        if not action:
            return

        try:
            if action in ("alt_f4", "alt+f4"):
                print("⚡ [ALT_F4] Received Alt+F4 action from Air Mouse")
                try:
                    pyautogui.hotkey("alt", "f4")
                    print("✓ [ALT_F4] Executed pyautogui.hotkey('alt', 'f4') successfully.")
                except Exception as e:
                    print(f"❌ [ALT_F4] Error executing Alt+F4 shortcut: {e}")

            elif action == "key_press":
                raw_key = str(payload.get("key", "")).lower().strip()
                key = "esc" if raw_key == "escape" else raw_key
                if key in ALLOWED_RECEIVER_KEYS:
                    pyautogui.press(key, _pause=False)

            elif action == "hotkey":
                raw_key = str(payload.get("key", "")).lower().strip()
                key = "esc" if raw_key == "escape" else raw_key
                raw_mods = payload.get("modifiers", [])
                mods = [str(m).lower().strip() for m in raw_mods if str(m).lower().strip() in ALLOWED_RECEIVER_MODIFIERS]
                if (key == "f4" and "alt" in mods) or raw_key in ("alt_f4", "alt+f4"):
                    print("⚡ [ALT_F4] Received Alt+F4 hotkey command from Air Mouse")
                    try:
                        pyautogui.hotkey("alt", "f4")
                        print("✓ [ALT_F4] Executed pyautogui.hotkey('alt', 'f4') successfully.")
                    except Exception as e:
                        print(f"❌ [ALT_F4] Error executing Alt+F4 shortcut: {e}")
                elif key in ALLOWED_RECEIVER_KEYS and mods:
                    pyautogui.hotkey(*mods, key, _pause=False)
                elif key in ALLOWED_RECEIVER_KEYS:
                    pyautogui.press(key, _pause=False)

            elif action == "type_text":
                raw_text = payload.get("text")
                if not isinstance(raw_text, str):
                    return
                # Clamp length to 250 max and strip unsafe control chars
                safe_text = raw_text[:250]
                safe_text = "".join(
                    c for c in safe_text
                    if c in ("\n", "\t") or (ord(c) >= 32 and ord(c) != 127)
                )
                if safe_text:
                    pyautogui.write(safe_text, interval=0.005)

            elif action == "key_down":
                raw_key = str(payload.get("key", "")).lower().strip()
                key = "esc" if raw_key == "escape" else raw_key
                if key in ALLOWED_RECEIVER_KEYS:
                    pyautogui.keyDown(key, _pause=False)
                    with self._lock:
                        self.held_keys.add(key)

            elif action == "key_up":
                raw_key = str(payload.get("key", "")).lower().strip()
                key = "esc" if raw_key == "escape" else raw_key
                if key in ALLOWED_RECEIVER_KEYS or key in self.held_keys:
                    pyautogui.keyUp(key, _pause=False)
                    with self._lock:
                        self.held_keys.discard(key)

        except Exception:
            # Prevent receiver from crashing on any keyboard input issue
            pass

    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "pairing_code":
                self.pairing_code = data.get("code", "------")
                self.cloud_status = "CONNECTED"
                self.phone_connected = False
                self.control_enabled = False
                self._stopped_by_user = False
                if self.gui_overlay:
                    self.gui_overlay.set_cloud_status("Connected", "#22c55e")
                    self.gui_overlay.set_pairing_code(self.pairing_code)
                self.print_status()

            elif msg_type == "pairing_success":
                self.phone_connected = True
                self.control_enabled = True
                self.session_token = data.get("sessionToken")
                self._stopped_by_user = False
                if self.gui_overlay:
                    self.gui_overlay.set_cloud_status("Connected", "#22c55e")
                    self.gui_overlay.set_phone_paired(data.get("hostname", "Phone"))
                self.print_status()

            elif msg_type == "mouse_relay":
                payload = data.get("payload", {})
                self.handle_command(payload)

            elif msg_type == "keyboard_relay":
                key_payload = data.get("keyPayload", {})
                self.handle_keyboard_command(key_payload)

            elif msg_type == "peer_disconnected":
                # Automatically stop control when phone disconnects
                self.phone_connected = False
                self.control_enabled = False
                # Release any stuck mouse button or keyboard keys
                try:
                    pyautogui.mouseUp(button='left', _pause=False)
                    pyautogui.mouseUp(button='right', _pause=False)
                except Exception:
                    pass
                with self._lock:
                    held = list(self.held_keys)
                    self.held_keys.clear()
                for k in held:
                    try:
                        pyautogui.keyUp(k, _pause=False)
                    except Exception:
                        pass
                for mod in ('shift', 'ctrl', 'alt'):
                    try:
                        pyautogui.keyUp(mod, _pause=False)
                    except Exception:
                        pass

                if self.gui_overlay:
                    self.gui_overlay.set_phone_disconnected()
                self.print_status()

            elif msg_type == "emergency_stopped":
                self.emergency_stop()

            elif msg_type in ("alt_f4", "ALT_F4") or data.get("command") == "ALT_F4":
                print("⚡ [ALT_F4] Received direct ALT_F4 message from Air Mouse")
                try:
                    pyautogui.hotkey("alt", "f4")
                    print("✓ [ALT_F4] Executed pyautogui.hotkey('alt', 'f4') successfully.")
                except Exception as e:
                    print(f"❌ [ALT_F4] Error executing Alt+F4 shortcut: {e}")

        except Exception:
            pass

    def on_error(self, ws, error):
        self.control_enabled = False
        try:
            pyautogui.mouseUp(button='left', _pause=False)
            pyautogui.mouseUp(button='right', _pause=False)
        except Exception:
            pass
        with self._lock:
            held = list(self.held_keys)
            self.held_keys.clear()
        for k in held:
            try:
                pyautogui.keyUp(k, _pause=False)
            except Exception:
                pass
        for mod in ('shift', 'ctrl', 'alt'):
            try:
                pyautogui.keyUp(mod, _pause=False)
            except Exception:
                pass

    def on_close(self, ws, close_status_code, close_msg):
        self.cloud_status = "DISCONNECTED"
        self.phone_connected = False
        self.control_enabled = False
        try:
            pyautogui.mouseUp(button='left', _pause=False)
            pyautogui.mouseUp(button='right', _pause=False)
        except Exception:
            pass
        with self._lock:
            held = list(self.held_keys)
            self.held_keys.clear()
        for k in held:
            try:
                pyautogui.keyUp(k, _pause=False)
            except Exception:
                pass
        for mod in ('shift', 'ctrl', 'alt'):
            try:
                pyautogui.keyUp(mod, _pause=False)
            except Exception:
                pass

        if self.gui_overlay:
            self.gui_overlay.set_cloud_status("Disconnected", "#ef4444")
        self.print_status()

    def on_open(self, ws):
        self.cloud_status = "CONNECTED"
        if self.gui_overlay:
            self.gui_overlay.set_cloud_status("Connected", "#22c55e")

        # Generate a cryptographically secure 6-digit PIN and register
        suggested_pin = self.generate_secure_pin()
        reg_payload = {
            "type": "register_receiver",
            "hostname": self.hostname,
            "code": suggested_pin
        }
        ws.send(json.dumps(reg_payload))

    def run_websocket_loop(self):
        """Maintains persistent WebSocket connection with auto-reconnection."""
        attempt = 0
        while self.is_running and attempt < MAX_RECONNECT_ATTEMPTS:
            try:
                self.cloud_status = "CONNECTING" if attempt == 0 else "RECONNECTING"
                if self.gui_overlay:
                    color = "#facc15"
                    self.gui_overlay.set_cloud_status(
                        "Connecting..." if attempt == 0 else f"Reconnecting (attempt {attempt+1})...",
                        color
                    )
                self.print_status()

                self.ws = websocket.WebSocketApp(
                    self.server_url,
                    on_open=self.on_open,
                    on_message=self.on_message,
                    on_error=self.on_error,
                    on_close=self.on_close
                )
                self.ws.run_forever(ping_interval=20, ping_timeout=10)
            except Exception:
                pass

            if not self.is_running:
                break

            attempt += 1
            self.cloud_status = "RECONNECTING"
            if self.gui_overlay:
                self.gui_overlay.set_cloud_status("Reconnecting...", "#facc15")
            self.print_status()
            time.sleep(RECONNECT_DELAY_SECONDS)

    def start(self):
        # Validate WebSocket URL before launching
        is_valid, err_msg = validate_ws_url(self.server_url)
        if not is_valid:
            print("=========================================================")
            print("🛑 [AIRMOUSE CONFIGURATION ERROR]")
            print(f"   {err_msg}")
            print("\nPlease specify a valid cloud WebSocket URL such as:")
            print("   ws://localhost:5000")
            print("   wss://your-cloud-backend.onrender.com")
            print("\nYou can configure this in:")
            print("   - receiver/config.json  (cloudWsUrl field)")
            print("   - receiver/.env         (CLOUD_WS_URL=wss://...)")
            print("   - Command line: --server wss://...")
            print("=========================================================")
            sys.exit(1)

        self.is_running = True

        # Start global Ctrl + A + H shortcut listener
        self.start_global_hotkey_listener()

        # Start GUI overlay if requested
        if self.enable_gui:
            try:
                from gui import EmergencyStopOverlay
                self.gui_overlay = EmergencyStopOverlay(on_emergency_stop=self.emergency_stop)
                self.gui_overlay.start()
            except Exception:
                self.gui_overlay = None

        # Start WebSocket in background thread
        ws_thread = threading.Thread(target=self.run_websocket_loop, daemon=True)
        ws_thread.start()

        self.print_status()

        # Terminal listener loop in main thread
        try:
            while self.is_running:
                user_input = input().strip().lower()
                if user_input in ("stop", "emergency"):
                    self.emergency_stop()
                elif user_input in ("exit", "quit", "q"):
                    self.stop()
                    break
        except (KeyboardInterrupt, SystemExit):
            self.emergency_stop()
            self.stop()

    def stop(self):
        self.is_running = False
        self.emergency_stop()
        if self.ws:
            try:
                self.ws.close()
            except Exception:
                pass
        print("\nAirMouse Receiver exited cleanly.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AirMouse Cloud - Windows Receiver")
    parser.add_argument("--server", default=DEFAULT_SERVER_URL, help=f"WebSocket Server URL (default: {DEFAULT_SERVER_URL})")
    parser.add_argument("--website", default=DEFAULT_WEBSITE_URL, help=f"AirMouse Web App URL (default: {DEFAULT_WEBSITE_URL})")
    parser.add_argument("--no-gui", action="store_true", help="Disable Tkinter emergency floating overlay")
    parser.add_argument("--install-startup", action="store_true", help="Configure AirMouse Receiver to automatically launch on Windows startup")
    parser.add_argument("--uninstall-startup", action="store_true", help="Remove AirMouse Receiver from Windows startup")

    args = parser.parse_args()

    if args.install_startup:
        manage_windows_startup(install=True)
        sys.exit(0)
    elif args.uninstall_startup:
        manage_windows_startup(install=False)
        sys.exit(0)

    receiver = AirMouseReceiver(server_url=args.server, website_url=args.website, enable_gui=not args.no_gui)
    receiver.start()
