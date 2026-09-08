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

# Local imports
try:
    from config import (
        DEFAULT_SERVER_URL,
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

class AirMouseReceiver:
    def __init__(self, server_url=DEFAULT_SERVER_URL, enable_gui=True):
        self.server_url = server_url.strip() if server_url else ""
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
        self._lock = threading.Lock()
        self._stopped_by_user = False

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
        print("Controls: Type 'stop' or press Ctrl+C for Emergency Stop")
        print("========================================")

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

        except Exception:
            # Prevent receiver from crashing on any unexpected input hiccup
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

            elif msg_type == "peer_disconnected":
                # Automatically stop control when phone disconnects
                self.phone_connected = False
                self.control_enabled = False
                # Release any stuck mouse button
                try:
                    pyautogui.mouseUp(button='left', _pause=False)
                    pyautogui.mouseUp(button='right', _pause=False)
                except Exception:
                    pass

                if self.gui_overlay:
                    self.gui_overlay.set_phone_disconnected()
                self.print_status()

            elif msg_type == "emergency_stopped":
                self.emergency_stop()

        except Exception:
            pass

    def on_error(self, ws, error):
        self.control_enabled = False
        try:
            pyautogui.mouseUp(button='left', _pause=False)
            pyautogui.mouseUp(button='right', _pause=False)
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
    parser.add_argument("--no-gui", action="store_true", help="Disable Tkinter emergency floating overlay")

    args = parser.parse_args()

    receiver = AirMouseReceiver(server_url=args.server, enable_gui=not args.no_gui)
    receiver.start()
